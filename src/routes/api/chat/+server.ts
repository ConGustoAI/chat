import { db } from '$lib/db';

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { defaultsUUID, messagesTable } from '$lib/db/schema';
import { DBupsertConversation, DBupsertMessages } from '$lib/db/utils';
import { undefineExtras } from '$lib/utils';
import { createAnthropic, type AnthropicProvider } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI, type GoogleGenerativeAIProvider } from '@ai-sdk/google';
import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { StreamData, streamText, type CoreAssistantMessage, type CoreUserMessage } from 'ai';
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
	const assistantData = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and, or }) =>
			and(eq(table.id, assistant), or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID))),
		with: {
			model: { with: { provider: true } },
			apiKey: true
		}
	});

	debug('assistantData %o', assistantData);
	if (!assistantData) error(404, 'Assistant not found or does not belong to the user');
	if (!assistantData.model) error(404, 'Assistant model not found');
	if (!assistantData.apiKey) error(404, 'Assistant does not have an API key');

	if (assistantData.model.userID !== defaultsUUID && assistantData.model.userID !== dbUser.id)
		error(403, 'Assistant does not belong to the user');
	if (assistantData.apiKey.userID !== defaultsUUID && assistantData.apiKey.userID !== dbUser.id)
		error(403, 'API key does not belong to the user');

	if (AM.text && !assistantData.model.prefill) error(403, 'Assistant does not support prefill');

	const clientSettings = { apiKey: assistantData.apiKey.key, baseURL: assistantData.model.provider.baseURL };

	let client: OpenAIProvider | GoogleGenerativeAIProvider | AnthropicProvider;
	if (assistantData.model.provider.type === 'openai') {
		client = createOpenAI(clientSettings);
	} else if (assistantData.model.provider.type === 'anthropic') {
		client = createAnthropic(clientSettings);
	} else if (assistantData.model.provider.type === 'google') {
		client = createGoogleGenerativeAI(clientSettings);
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

	if (!conversation.id) conversation = (await DBupsertConversation({ dbUser, conversation })) as ConversationInterface;
	if (!conversation.id) error(500, 'Failed to create conversation');
	UM.conversationId = AM.conversationId = conversation.id;
	UM.userID = AM.userID = dbUser.id;

	d.append({ conversationId: conversation.id });

	async function onFinish(
		// I don't always love TypeScript
		result: NonNullable<Parameters<NonNullable<Parameters<typeof streamText>[0]['onFinish']>>>[0]
	): Promise<void> {
		debug('streamText result:', result);

		try {
			AM.finishReason = result.finishReason;
			AM.usageIn = isNaN(result.usage.promptTokens) ? 0 : result.usage.promptTokens;
			AM.usageOut = isNaN(result.usage.completionTokens) ? 0 : result.usage.completionTokens;
			AM.text += result.text;

			debug('Messages after processing: %o', { userMessage: UM, assistantMessage: AM });

			const [[iUM, iAM], DMs] = await Promise.all([
				DBupsertMessages({
					dbUser,
					messages: [UM, AM]
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
					})
			]);

			debug('After updating the DB: %o', { userMessage: iUM, assistantMessage: iAM, deletedMessages: DMs });
			if (!iUM.id || !iAM.id) error(500, 'Failed to update messages');
			if (DMs.length != (toDelete?.length ?? 0)) error(500, 'Failed to delete messages');

			// d.append() can't handle the native Date object, so we need to convert it to a string
			const [cUM, cAM, cDMs] = [iUM, iAM, ...DMs].map((m) => ({
				...m,
				updatedAt: m.updatedAt?.toISOString(),
				createdAt: m.createdAt?.toISOString()
			}));

			d.append({ userMessage: cUM, assistantMessage: cAM, deletedMessages: cDMs });
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
			model: client(assistantData.model.name),
			messages: inputMessages,
			system: assistantData.systemPrompt,
			onFinish: onFinish
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
