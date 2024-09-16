import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, not, sql } from 'drizzle-orm';
import { db } from '../index';
import { conversationsTable, defaultsUUID } from '../schema';

export async function DBgetDefaultConversations() {
	const conversations = await db.query.conversationsTable.findMany({
		where: (table, { eq, and, not }) => and(eq(table.userID, defaultsUUID), not(eq(table.deleted, true))),
		orderBy: (table, { desc }) => [desc(table.order)]
	});

	if (!conversations) error(500, 'Failed to fetch default conversations');

	return conversations;
}

export async function DBgetDefaultConversation({ id }: { id: string }) {
	const conversation = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, defaultsUUID)),
		with: {
			messages: {
				where: (table, { eq, not }) => not(eq(table.deleted, true)),
				orderBy: (table, { asc }) => [asc(table.order)]
			}
		}
	});

	if (!conversation) error(404, 'Conversation not found or does not belong to the user');

	return conversation;
}

export function dbGetPublicConversation({ id }: { id: string }) {
	return db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.public, true)),
		with: {
			messages: {
				where: (table, { eq, not }) => not(eq(table.deleted, true)),
				orderBy: (table, { asc }) => [asc(table.order)]
			}
		}
	});
}

export async function DBgetConversations({ dbUser }: { dbUser?: UserInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	const conversations = await db.query.conversationsTable.findMany({
		where: (table, { eq }) => and(eq(table.userID, dbUser.id), not(eq(table.deleted, true))),
		orderBy: (table, { desc }) => [desc(table.order)]
	});

	if (!conversations) error(500, 'Failed to fetch conversations');

	return conversations;
}

export async function DBgetConversation({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	if (!dbUser) error(401, 'Unauthorized');
	const conversation = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, dbUser.id)),
		with: {
			messages: {
				where: (table, { eq, not }) => not(eq(table.deleted, true)),
				orderBy: (table, { asc }) => [asc(table.order)],
				with: { prompt: true }
			}
		}
	});

	if (!conversation) error(404, 'Conversation not found or does not belong to the user');

	return conversation;
}

export async function DBConversationUpdateTokens({
	dbUser,
	conversationID,
	tokensIn,
	tokensOut
}: {
	dbUser?: UserInterface;
	conversationID: string;
	tokensIn: number;
	tokensOut: number;
}) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!conversationID) error(400, 'Conversation ID is required');
	const update = await db
		.update(conversationsTable)
		.set({
			tokensIn: sql`${conversationsTable.tokensIn} + ${tokensIn}`,
			tokensOut: sql`${conversationsTable.tokensOut} + ${tokensOut}`
		})
		.where(and(eq(conversationsTable.id, conversationID), eq(conversationsTable.userID, dbUser.id)))
		.returning();

	if (!update.length) {
		error(403, 'Tried to update a conversation that does not exist or does not belong to the user');
	}

	return update[0];
}

export async function DBupsertConversation({
	dbUser,
	conversation,
	tokensIn,
	tokensOut,
	tokensInCost,
	tokensOutCost
}: {
	dbUser?: UserInterface;
	conversation: ConversationInterface;
	tokensIn?: number;
	tokensOut?: number;
	tokensInCost?: number;
	tokensOutCost?: number;
}) {
	if (!dbUser) error(401, 'Unauthorized');
	if (conversation.userID != dbUser.id && (!dbUser.admin || conversation.userID !== defaultsUUID))
		error(401, 'Tried to update a conversation that does not belong to the user');

	conversation = undefineExtras(conversation);

	if (conversation.id) {
		const update = await db
			.update(conversationsTable)
			.set({
				...conversation,
				tokensIn: sql`${conversationsTable.tokensIn} + ${tokensIn ?? 0}`,
				tokensOut: sql`${conversationsTable.tokensOut} + ${tokensOut ?? 0}`,
				tokensInCost: sql`${conversationsTable.tokensInCost} + ${tokensInCost ?? 0}`,
				tokensOutCost: sql`${conversationsTable.tokensOutCost} + ${tokensOutCost ?? 0}`
			})
			.where(and(eq(conversationsTable.id, conversation.id), eq(conversationsTable.userID, conversation.userID)))
			.returning();

		if (!update.length) {
			error(403, 'Tried to update a conversation that does not exist or does not belong to the user');
		}

		return update[0];
	}

	const insert = await db
		.insert(conversationsTable)
		.values({
			...conversation,
			tokensIn: (conversation.tokensIn ?? 0) + (tokensIn ?? 0),
			tokensOut: (conversation.tokensOut ?? 0) + (tokensOut ?? 0)
		})
		.onConflictDoNothing()
		.returning();

	if (!insert || !insert.length) error(500, 'Failed to update conversation');

	return insert[0];
}

export async function DBdeleteConversation({ dbUser, ids }: { dbUser?: UserInterface; ids: string[] }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!Array.isArray(ids) || ids.length === 0) error(400, 'At least one conversation ID is required');

	const res = await db
		.delete(conversationsTable)
		.where(and(inArray(conversationsTable.id, ids), eq(conversationsTable.userID, dbUser.id)))
		.returning({ id: conversationsTable.id });

	if (!res.length) error(500, 'Failed to delete conversation');

	return res[0];
}
