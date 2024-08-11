import { db } from '$lib/db';

import { error, type RequestHandler } from '@sveltejs/kit';

import { messagesTable } from '$lib/db/schema';
import { DBupsertConversation, DBupsertMessage } from '$lib/db/utils';
import { undefineExtras } from '$lib/utils';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { StreamData, streamText, type CoreAssistantMessage, type CoreUserMessage } from 'ai';
import { inArray } from 'drizzle-orm';
import dbg from 'debug';

const debug = dbg('app:api:chat');

// Create a new conversation
export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const data = await request.json();
	let conversation = data.conversation as ConversationInterface;
	const messages = conversation.messages ?? [];
	const toDelete = data.toDelete as string[];
	const assistant = conversation.assistant;

	debug('POST /chat:', { conversation, toDelete });

	if (!assistant) error(400, 'Assistant ID required');
	if (messages?.length < 2) error(400, 'Conversation should have at least 2 messages, got ' + messages.length);

	let [UM, AM] = messages.slice(-2);

	UM = undefineExtras(UM);
	AM = undefineExtras(AM);

	const oldMessages = messages.slice(0, -2);

	debug('Messages:', { userMessage: UM, assistantMessage: AM, oldMessages });

	if (UM.role != 'user') error(400, 'The first new message should be from the user.');
	if (AM.role != 'assistant') error(400, 'The second new message in a conversation should be from the assistant.');

	// Check that the assistant belongs to the user
	const assistantData = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, assistant), eq(table.userID, user.id)),
		with: {
			model: { with: { provider: true } },
			apiKey: true
		}
	});

	debug('assistantData', assistantData);
	if (!assistantData) error(404, 'Assistant not found or does not belong to the user');
	if (!assistantData.model) error(404, 'Assistant model not found');
	if (!assistantData.apiKey) error(404, 'Assistant does not have an API key');

	if (UM.text && !assistantData.model.prefill) error(403, 'Assistant does not support prefill');

	let client = null;
	const clientSettings = { apiKey: assistantData.apiKey.key, baseURL: assistantData.model.provider.baseURL };

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

	if (!conversation.id) conversation = (await DBupsertConversation(conversation, user.id)) as ConversationInterface;
	if (!conversation.id) error(500, 'Failed to create conversation');
	UM.conversationId = AM.conversationId = conversation.id;
	d.append({ conversationId: conversation.id });

	try {
		const result = await streamText({
			model: client(assistantData.model.name),
			messages: inputMessages,
			system: assistantData.systemPrompt,
			onFinish: async (result) => {
				debug('streamText result:', result);

				try {
					AM.finishReason = result.finishReason;
					AM.usageIn = isNaN(result.usage.promptTokens) ? 0 : result.usage.promptTokens;
					AM.usageOut = isNaN(result.usage.completionTokens) ? 0 : result.usage.completionTokens;
					AM.text += result.text;

					debug('Messages after processing:', { userMessage: UM, assistantMessage: AM });

					const iUM = await DBupsertMessage(UM, user.id);
					if (!iUM) error(500, 'Failed to insert user message');
					debug('Inserted user message:', iUM);

					const iAM = await DBupsertMessage(AM, user.id);
					if (!iAM) error(500, 'Failed to insert assistant message');
					debug('Inserted assistant message:', iAM);

					const DMs = await db
						.update(messagesTable)
						.set({ deleted: true })
						.where(inArray(messagesTable.id, toDelete ?? []))
						.returning({ id: messagesTable.id, deleted: messagesTable.deleted });

					debug('Deleted messages:', DMs);

					// Insert the messages
					const [cUM, cAM, cDMs] = [iUM, iAM, DMs].map((m) => ({
						...m,
						updatedAt: 'updatedAt' in m ? m.updatedAt?.toISOString() : undefined,
						createdAt: 'createdAt' in m ? m.createdAt?.toISOString() : undefined
					}));

					// @ts-expect-error - Ts complaining about possible null for values that can't be null;
					d.append({ userMessage: cUM, assistantMessage: cAM, deletedMessages: cDMs });
				} catch (e: unknown) {
					debug('Error in onFinish:', e);
					d.append({ error: JSON.stringify(e) });
				} finally {
					await d.close();
				}
			}
		});

		return result.toDataStreamResponse({ data: d });
	} catch (e: unknown) {
		debug('Error in streamText:', e);
		d.append({ error: JSON.stringify(e) });
		await d.close();
		if (e instanceof Error) {
			error(500, 'Failed to process the conversation: ' + e.message);
		} else {
			error(500, 'Failed to process the conversation: An unknown error occurred');
		}
	}
};
