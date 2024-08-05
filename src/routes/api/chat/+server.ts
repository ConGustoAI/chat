import { db } from '$lib/db';

import { type RequestHandler, error } from '@sveltejs/kit';

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { StreamData, streamText, type CoreAssistantMessage, type CoreUserMessage } from 'ai';
import { conversationsTable, messagesTable } from '$lib/db/schema';

// Create a new conversation
export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = locals;
	if (!user) {
		error(401, 'Unauthorized');
	}

	const { conversation }: { conversation: ConversationInterface } = await request.json();
	console.log('POST /chat/:', { conversation });

	if (!conversation.assistant) {
		error(400, 'Assistant ID required');
	}
	// chat = 'ab06a0cd-d7e5-4a85-83d6-484cb5f06576';

	// Check that the assistant belongs to the user
	const assistantData = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, conversation.assistant!), eq(table.userID, user.id)),
		with: {
			model: { with: { provider: true } },
			apiKey: true,
			conversations:
				conversation.id !== 'new'
					? {
							where: (table, { eq }) => eq(table.id, conversation.id!)
						}
					: undefined
		}
	});

	console.log('assistantData', assistantData);

	if (!conversation || !conversation.assistant) error(404, 'The conversation or assistant is missing');
	if (!conversation.messages) error(400, 'The conversation messages are missing.');
	if (conversation.messages.length < 2) error(400, 'The conversation should have at least 2 messages.');
	if (conversation.messages[0].role !== 'user') error(400, 'The first message should be from the user.');
	if (conversation.messages[conversation.messages.length - 1].role !== 'assistant') {
		error(400, 'The last message should be from the assistant.');
	}

	if (!assistantData || assistantData?.id != conversation.assistant) {
		error(403, 'Assistant not found');
	}

	if (conversation.messages[conversation.messages.length - 1].text && !assistantData.prefill)
		error(403, 'Assistant does not support prefill');

	if (!assistantData.model) {
		error(500, 'Incomplete assistant data, missing model');
	}

	if (!assistantData.apiKey) {
		error(500, 'Incomplete assistant data, missing API key');
	}

	if (conversation.id != 'new' && !assistantData.conversations) {
		error(404, 'Conversation not found');
	}

	if (conversation.id != 'new' && conversation.id != assistantData.conversations[0].id) {
		error(403, 'DB returned wrong conversation??');
	}

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

	const d = new StreamData();
	d.append({ hello: 'world' });

	const inputMessages: (CoreAssistantMessage | CoreUserMessage)[] = conversation.messages.map((m) => ({
		role: m.role,
		content: [{ type: 'text', text: m.text }]
	}));

	// Remove the last message if it's empty. I wan to keep it in the conversation, but not send it to the AI.
	if (
		conversation.messages[conversation.messages.length - 1].role === 'assistant' &&
		!conversation.messages[conversation.messages.length - 1].text
	) {
		inputMessages.pop();
	}

	const result = await streamText({
		model: client(assistantData.model.name),
		messages: inputMessages,
		system: assistantData.systemPrompt,
		onFinish: async (result) => {
			console.log('result', result);

			try {
				const { conversationId, newMessages } = await db.transaction(async (tx) => {
					if (conversation.id === 'new') {
						const convInsertResult = await tx
							.insert(conversationsTable)
							.values({
								assistant: conversation.assistant,
								userID: user.id,
								summary: conversation.summary
							})
							.returning({
								id: conversationsTable.id
							});
						//).map((o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null)));

						if (!convInsertResult?.length || !convInsertResult[0]?.id) {
							error(500, 'Failed to create conversation');
						}
						conversation.id = convInsertResult[0].id;
					}

					// This should never fire, but TS is being silly for somre reason.
					if (!conversation.messages) error(500, 'No messages to insert');

					// Add stats to the assistants reply.
					const m = conversation.messages[conversation.messages.length - 1];
					m.finishReason = result.finishReason;
					m.usageIn = result.usage.promptTokens;
					m.usageOut = result.usage.completionTokens;
					m.text = result.text;

					console.log('conversation', conversation);

					// if (!conversation.id) error(500, 'No conversation ID');
					// Keep only the messages without an id - those are the new ones.
					const newMessages = conversation
						.messages!.filter((m) => !m.id)
						.map((m) => {
							return {
								...m,
								conversationId: conversation.id
							};
						});
					console.log('(before insert) newMessages', newMessages);

					// // Insert the message
					const inseredMessages = await tx.insert(messagesTable).values(newMessages).returning({
						id: messagesTable.id,
						conversationId: messagesTable.conversationId,
						useageIn: messagesTable.usageIn,
						useageOut: messagesTable.usageOut,
						finishReason: messagesTable.finishReason
					});
					console.log('inseredMessages', inseredMessages);
					if (inseredMessages.length != 2) error(500, 'Failed to insert messages');

					return { conversationId: conversation.id, newMessages: inseredMessages };
				});

				console.log('insertResult', { conversationId, newMessages });
				d.append({ conversationId, newMessages });
			} catch (err) {
				console.error('Error inserting message:', err);
				error(500, 'Error inserting message: ' + err);
			}
			await d.close();
		}
	});

	return result.toDataStreamResponse({ data: d });
};
