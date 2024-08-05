import { db } from '$lib/db';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

import { type RequestHandler, error } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// Create a new conversation
export const POST: RequestHandler = async ({ request, locals, params: { chat } }) => {
	const { user } = locals;
	if (!user) {
		error(401, 'Unauthorized');
	}

	const { message } = await request.json();
	if (!message) {
		error(400, 'Message required');
	}
	if (!chat) {
		error(400, 'Conversation ID required');
	}

	// Create a new conversation

	// Check that the assistant belongs to the user
	const convo = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, chat), eq(table.userID, user.id)),
		with: {
			assistant: {
				with: {
					model: {
						with: { provider: true }
					},
					apiKey: true
				}
			}
		}
	});

	console.log(`POST /chat/[${chat}]/`, convo);
	if (!convo?.id) {
		error(403, 'Conversation not found');
	}

	// console.log('conversationId', conversationId);

	return json({ chat: conversationId });
};
