import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { conversationsTable } from '../schema';

export async function DBgetConversations(userID: string) {
	const conversations = await db.query.conversationsTable.findMany({
		where: (table, { eq, and }) => and(eq(table.userID, userID), eq(table.deleted, false)),
		orderBy: (table, { desc }) => [desc(table.updatedAt)]
	});

	return conversations;
}

export async function DBgetConversation(id: string, userID: string, withMessages: boolean = false) {
	const conversation = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, userID), eq(table.deleted, false)),
		with: {
			...(withMessages && { messages: true })
		}
	});

	if (!conversation) {
		error(404, 'Conversation not found or does not belong to the user');
	}

	return conversation;
}

export async function DBupsertConversation(conversation: ConversationInterface, userID: string) {
    conversation = undefineExtras(conversation);
    conversation.userID = userID; // Ensure userID is set

    if (conversation.id) {
		const upsete = await db
			.update(conversationsTable)
			.set(conversation)
			.where(eq(conversationsTable.id, conversation.id))
			.returning();

        if (!upsete?.length) {
            error(403, 'Tried to update a conversation that does not exist or does not belong to the user');
        }

        return upsete[0];
	}

	const insert = await db
		.insert(conversationsTable)
		// @ts-expect-error - It userID is set right above!
		.values(conversation)
		.onConflictDoNothing()
		.returning();

	if (!insert || !insert.length) {
		error(500, 'Failed to update conversation');
	}

	return insert[0];
}

export async function DBdeleteConversation(id: string, userID: string) {
	const res = await db
		.delete(conversationsTable)
		.where(and(eq(conversationsTable.id, id), eq(conversationsTable.userID, userID)))
		.returning({ id: conversationsTable.id });

	if (!res || !res.length) {
		error(500, 'Failed to delete conversation');
	}

	return res[0];
}
