import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { messagesTable } from '../schema';

// export async function DBgetMessages(conversationID: string, userID: string) {
// 	const messages = await db.query.messagesTable.findMany({
// 		where: (table, { eq, and }) => and(eq(table.conversationID, conversationID), eq(table.userID, userID)),
// 		orderBy: (table, { asc }) => [asc(table.createdAt)]
// 	});

// 	return messages;
// }

export async function DBgetMessage(id: string, userID: string) {
	const message = await db.query.messagesTable.findFirst({
		where: (table, { eq }) => and(eq(table.id, id)),
		with: {
			conversation: {
				columns: { id: true, userID: true }
			}
		}
	});

	if (!message) {
		error(404, 'Message not found');
	}

	if (message.conversation.userID !== userID) {
		error(403, 'Message does not belong to the user');
	}

	return { ...message, conversation: undefined };
}

export async function DBupsertMessage(message: MessageInterface, userID: string) {
	message = undefineExtras(message);

	if (message.id) {
		// Check the message belongs to the user
		const userMessage = await db.query.messagesTable.findFirst({
			where: (table, { eq }) => eq(table.id, message.id!),
			with: {
				conversation: {
					columns: { id: true, userID: true }
				}
			}
		});

		if (!userMessage) error(404, 'Message not found');
		if (userMessage.conversationId !== message.conversationId)
			error(403, 'Tried to update a message that does not belong to the conversation');
		if (userMessage.conversation.userID !== userID) error(403, 'Tried to update a message that does not belong to the user');

		const update = await db.update(messagesTable).set(message).where(eq(messagesTable.id, message.id)).returning();
		if (!update?.length) error(403, 'Failed to update message');

		return update[0];
	}

	if (!message.conversationId) error(400, 'Missing conversationId');
	// @ts-expect-error - conversationId is checked above
	const insertionResult = await db.insert(messagesTable).values(message).onConflictDoNothing().returning();

	if (!insertionResult || !insertionResult.length) {
		error(500, 'Failed to insert message');
	}

	return insertionResult[0];
}

export async function DBdeleteMessage(id: string, userID: string) {
	// First, check if the message belongs to the user's conversation
	const message = await db.query.messagesTable.findFirst({
		where: (table, { eq }) => eq(table.id, id),
		with: {
			conversation: {
				columns: { userID: true }
			}
		}
	});

	if (!message) {
		error(404, 'Message not found');
	}

	if (message.conversation.userID !== userID) {
		error(403, 'Tried to delete a message that does not belong to the user');
	}

	const res = await db.delete(messagesTable).where(eq(messagesTable.id, id)).returning({ id: messagesTable.id });

	if (!res || !res.length) {
		error(500, 'Failed to delete message');
	}

	return res[0];
}
