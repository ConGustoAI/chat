import { db } from '$lib/db';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { defaultsUUID, messagesTable } from '$lib/db/schema';
import { DBupdateUser, DBupsertConversation, DBupsertMessage } from '$lib/db/utils';
import { DBinsertPrompt } from '$lib/db/utils/prompts';
import { filterNull, promptHash, undefineExtras } from '$lib/utils';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { StreamData, streamText, type CoreAssistantMessage, type CoreUserMessage, type JSONValue } from 'ai';
import dbg from 'debug';
import { inArray } from 'drizzle-orm';

const debug = dbg('app:api:chat');

// Create a new conversation
export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	if (!dbUser) {
		error(401, 'Unauthorized');
	}

	const data = await request.json();
	let conversation = data.conversation as ConversationInterface;
	const messages = conversation.messages ?? [];
	const toDelete = data.toDelete as string[];
	const assistant = conversation.assistant;

	debug('POST /chat: %o', { conversation, toDelete });

	if (!assistant) error(400, 'Assistant ID required');
	if (messages?.length < 2) error(400, 'Conversation should have at least 2 messages, got ' + messages.length);

	let [UM, AM] = messages.slice(-2);

	UM = undefineExtras(UM);
	AM = undefineExtras(AM);

	const oldMessages = messages.slice(0, -2);

	debug('Messages: %o', { userMessage: UM, assistantMessage: AM, oldMessages });

	if (UM.role != 'user') error(400, `Expected user message, got '${UM.role}'`);
	if (AM.role != 'assistant') error(400, 'Expected assistant message, got ' + AM.role);

	// Check that the assistant belongs to the user or is a default assistant
	const [assistantData, keys] = await Promise.all([
		db.query.assistantsTable.findFirst({
			where: (table, { eq, and, or }) =>
				and(eq(table.id, assistant), or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID))),
			with: { model: { with: { provider: true } } }
		}),
		db.query.apiKeysTable.findMany({
			where: (table, { eq, or }) => or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID))
		})
	]);

	debug('assistantData, keys %o', { assistantData, keys });
	if (!assistantData) error(404, 'Assistant not found or does not belong to the user');
	if (!assistantData.model) error(404, 'Assistant model not found');

	if (assistantData.model.userID !== defaultsUUID && assistantData.model.userID !== dbUser.id)
		error(403, "Assistant's model does not belong to the user?");

	const userProfile = (assistantData.aboutUserFromUser ? dbUser.aboutUser : assistantData.aboutUser) ?? '';
	const assistantInstrictions =
		(assistantData.assistantInstructionsFromUser
			? dbUser.assistantInstructions
			: assistantData.assistantInstructions) ?? '';

	let systemPrompt = (assistantData.systemPrompt ?? '')
		.replace('{profile}', userProfile)
		.replace('{instructions}', assistantInstrictions);

	const systemPromptHash = await promptHash(systemPrompt);

	const key = keys.find((k) => k.providerID && k.providerID === assistantData.model?.provider.id);
	if (!key)
		error(
			403,
			`No api key found for provider ${assistantData.model.provider.name} (${assistantData.model.provider.id})`
		);

	if (AM.text && !assistantData.model.prefill) error(403, 'Assistant does not support prefill');

	const clientSettings = { apiKey: key.key, baseURL: assistantData.model.provider.baseURL };

	// debug('clientSettings: %o', { clientSettings });

	let client;
	if (assistantData.model.provider.type === 'openai') {
		const aiModel = createOpenAI({
			...clientSettings,
			// Some OpenAI-compatible providers don't support usage when streaming.
			compatibility: assistantData.model.provider.openAIStreamUsage ? 'strict' : 'compatible'
		});
		client = aiModel(assistantData.model.name);
	} else if (assistantData.model.provider.type === 'anthropic') {
		const aiModel = createAnthropic(clientSettings);
		client = aiModel(assistantData.model.name);
	} else if (assistantData.model.provider.type === 'google') {
		const theresholds = ['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE'];
		let threshold;
		if (
			assistantData.googleSafetyThreshold !== null &&
			assistantData.googleSafetyThreshold > 0 &&
			assistantData.googleSafetyThreshold < 4
		) {
			threshold = theresholds[assistantData.googleSafetyThreshold];
		} else {
			threshold = 'BLOCK_NONE';
		}

		const safetySettings = [
			{ category: 'HARM_CATEGORY_HARASSMENT', threshold },
			{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold },
			{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold },
			{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold }
		];

		const aiModel = createGoogleGenerativeAI(clientSettings);
		// @ts-expect-error - google added more categories, waiting for Vercel AI to catcup up.
		client = aiModel('models/' + assistantData.model.name, { safetySettings });
	} else {
		error(500, 'Unsupported provider, this is a bug');
	}

	const inputMessages: (CoreAssistantMessage | CoreUserMessage)[] = [...oldMessages, UM, ...(AM.text ? [AM] : [])].map(
		(m) => ({
			role: m.role,
			content: [{ type: 'text', text: m.text }]
		})
	);

	const d = new StreamData();

	conversation.assistantName = assistantData.name;
	conversation.model = assistantData.model.id;
	conversation.modelName = assistantData.model.name;
	conversation.provider = assistantData.model.provider.id;
	conversation.providerName = assistantData.model.provider.name;

	// We end up inserting the conversation twice, because we need the conversation ID to insert the messages,
	// and I want to insert the messages and update the final conversation in parallel.
	if (!conversation.id) conversation = (await DBupsertConversation({ dbUser, conversation })) as ConversationInterface;
	if (!conversation.id) error(500, 'Failed to create conversation');
	UM.conversationID = AM.conversationID = conversation.id;
	UM.userID = AM.userID = dbUser.id;

	if (assistantData.model.provider.type === 'openai' && assistantData.model.name.startsWith('o1') && systemPrompt) {
		inputMessages.unshift({
			role: 'user',
			content: [{ type: 'text', text: 'SYSTEM PROMPT:\n' + systemPrompt }]
		});
		systemPrompt = '';
	}

	async function onFinish(
		// I don't always love TypeScript
		result: NonNullable<Parameters<NonNullable<Parameters<typeof streamText>[0]['onFinish']>>>[0]
	): Promise<void> {
		debug('streamText result:', JSON.stringify(result, null, 2));

		try {
			if (!assistantData) error(500, 'Assistant data is missing'); // Should neve happen, but TS is complaining.
			if (!dbUser) error(500, "dbUser is missing")

			// experimental_providerMetadata: { openai: { reasoningTokens: 128 } },
			const reasoningTokens = result.experimental_providerMetadata?.openai?.reasoningTokens as number | undefined;

			AM.finishReason = result.finishReason;
			AM.tokensIn = isNaN(result.usage.promptTokens) ? 0 : result.usage.promptTokens;
			AM.tokensOut = isNaN(result.usage.completionTokens) ? 0 : result.usage.completionTokens;
			AM.tokensInCost = assistantData.model?.inputCost ? (AM.tokensIn / 1000000) * assistantData.model.inputCost : 0;
			AM.tokensOutCost = assistantData.model?.outputCost
				? (AM.tokensOut / 1000000) * assistantData.model.outputCost
				: 0;
			AM.tokensReasoning = reasoningTokens && isNaN(reasoningTokens) ? 0 : reasoningTokens;
			AM.tokensReasoningCost = assistantData.model?.outputCost
				? ((AM.tokensReasoning ?? 0) / 1000000) * assistantData.model.outputCost
				: 0;
			AM.text += result.text;
			AM.assistantID = assistantData.id;
			AM.assistantName = assistantData.name;
			AM.model = assistantData.model?.id;
			AM.modelName = assistantData.model?.name;
			AM.temperature = assistantData.temperature;
			AM.topP = assistantData.topP;
			AM.topK = assistantData.topK;
			AM.promptID = systemPromptHash;

			debug('Messages after processing: %o', { userMessage: UM, assistantMessage: AM });

			// insert the user messages first to avoid inserting them out of order.
			// The system prompt should be inserted before the assistant message.
			const [iUM, iP] = await Promise.all([
				DBupsertMessage({ dbUser, message: UM }),
				DBinsertPrompt({ id: systemPromptHash, text: systemPrompt })
				// db.insert(promptsTable).values({ id: systemPromptHash, text: systemPrompt }).onConflictDoNothing().returning()
			]);

			// Insert/update the rest in parallel
			const [iAM, iDMs, iC, iU] = (await Promise.all([
				DBupsertMessage({
					dbUser,
					message: AM
				}),
				db
					.update(messagesTable)
					.set({ deleted: true })
					.where(inArray(messagesTable.id, toDelete ?? []))
					.returning({
						id: messagesTable.id,
						deleted: messagesTable.deleted,
						updatedAt: messagesTable.updatedAt,
						createdAt: messagesTable.createdAt
					}),
				DBupsertConversation({
					dbUser,
					conversation,
					tokensIn: AM.tokensIn,
					tokensOut: AM.tokensOut,
					tokensInCost: AM.tokensInCost,
					tokensOutCost: AM.tokensOutCost,
					tokensReasoning: AM.tokensReasoning,
					tokensReasoningCost: AM.tokensReasoningCost
				}),
				DBupdateUser({ dbUser, updatedUser: { id: dbUser!.id, lastAssistant: assistantData.id } })
			])) as [MessageInterface, MessageInterface[], ConversationInterface, UserInterface];

			iAM.prompt = filterNull(iP) as PromptInterface;
			debug('After updating the DB: %o', {
				userMessage: iUM,
				assistantMessage: iAM,
				deletedMessages: iDMs,
				conversation: iC,
				prompt: iP,
				user: iU
			});
			if (!iUM.id || !iAM.id) error(500, 'Failed to update messages');
			if (iDMs.length != (toDelete?.length ?? 0)) error(500, 'Failed to delete messages');

			// d.append() can't handle the native Date object, so we need to convert it to a string
			const [cUM, cAM, cC, cDMs] = [iUM, iAM, iC, ...iDMs].map((m) => ({
				...m,
				updatedAt: m.updatedAt?.toISOString(),
				createdAt: m.createdAt?.toISOString()
			})) as [unknown, unknown, unknown, unknown] as [JSONValue, JSONValue, JSONValue, JSONValue[]];

			d.append({ userMessage: cUM, assistantMessage: cAM, deletedMessages: cDMs, conversation: cC });
			if (result.warnings) d.append({ warnings: result.warnings });
		} catch (e: unknown) {
			debug('Error in onFinish:', e);
			await d.close();
			throw e;
		}
		await d.close();
	}

	try {
		const result = await streamText({
			model: client,
			messages: inputMessages,
			system: systemPrompt?.trim().length ? systemPrompt : undefined,
			temperature: assistantData.temperature,
			topP: assistantData.topP,
			topK: assistantData.topK,
			maxTokens: assistantData.maxTokens || undefined,
			onFinish: onFinish,
			abortSignal: request.signal
		});

		return result.toDataStreamResponse({ data: d });
	} catch (e: unknown) {
		debug('Error in streamText:', e);
		d.append({ error: JSON.stringify(e) });
		await d.close();

		// Looks like an exception thrown by error(). Just propagate it.
		if (e && typeof e === 'object' && 'status' in e && 'body' in e) {
			throw e;
		}
		if (e instanceof Error) {
			error(500, 'Failed to process the conversation: ' + e.message);
		} else {
			error(500, 'Failed to process the conversation: An unknown error occurred');
		}
	}
};
