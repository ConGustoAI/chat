import { conversationInterfaceFilter } from '$lib/api';
import { getDownloadURL } from '$lib/utils/files_server';
import { trimLineLength } from '$lib/utils/utils';
import { error } from '@sveltejs/kit';
import dbg from 'debug';
import { and, eq, inArray, not } from 'drizzle-orm';
import { db } from '../index';
import { conversationsTable, defaultsUUID } from '../schema';

const debug = dbg('app:db:utils:conversations');

export async function DBgetDefaultConversations() {
	const conversations = await db.query.conversationsTable.findMany({
		// XXX I don't think we use .deleted anymore
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
			},
			media: {
				orderBy: (table, { asc }) => [asc(table.order)],
				with: {
					original: true,
					thumbnail: true
				}
			}
		}
	});

	if (!conversation) error(404, 'Conversation not found or does not belong to the user');

	// Sanity check. Messages and Media attached to the conversation should have the same user id.
	for (const m of conversation.messages) {
		if (m.userID !== conversation.userID) throw new Error('Message user ID mismatch');
	}

	for (const m of conversation.media as MediaInterface[]) {
		if (m.userID !== conversation.userID) throw new Error('Media user ID mismatch');
		if (m.original && m.original?.userID !== conversation.userID)
			throw new Error("Media file 'original' user ID mismatch");

		if (m.original && m.original.size > 0) m.original.url = await getDownloadURL(m.original);
		if (m.thumbnail && m.thumbnail.size > 0) m.thumbnail.url = await getDownloadURL(m.thumbnail);
	}



	return conversation;
}

export async function DBGetPublicConversation({ id }: { id: string }) {
	const conversation = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.public, true)),
		with: {
			messages: {
				where: (table, { eq, not }) => not(eq(table.deleted, true)),
				orderBy: (table, { asc }) => [asc(table.order)]
			},
			media: {
				orderBy: (table, { asc }) => [asc(table.order)],
				with: {
					original: true,
					thumbnail: true
				}
			}
		}
	});

	if (!conversation) error(404, 'Conversation not found or is not public');

	// Sanity check. Messages and Media attached to the conversation should have the same user id.
	for (const m of conversation.messages) {
		if (m.userID !== conversation.userID) throw new Error('Message user ID mismatch');
	}

	for (const m of conversation.media as MediaInterface[]) {
		if (m.userID !== conversation.userID) throw new Error('Media user ID mismatch');
		if (m.original && m.original?.userID !== conversation.userID)
			throw new Error("Media file 'original' user ID mismatch");

		if (m.original && m.original.size > 0) m.original.url = await getDownloadURL(m.original);
		if (m.thumbnail && m.thumbnail.size > 0) m.thumbnail.url = await getDownloadURL(m.thumbnail);
	}

	return conversation;
}

export async function DBgetConversations({ session }: { session?: SessionInterface }) {
	if (!session) error(401, 'Unauthorized');
	const conversations = await db.query.conversationsTable.findMany({
		where: (table, { eq }) => and(eq(table.userID, session.userID), not(eq(table.deleted, true))),
		orderBy: (table, { desc }) => [desc(table.order)]
	});

	if (!conversations) error(500, 'Failed to fetch conversations');
	return conversations;
}

export async function DBgetConversation({ session, id }: { session: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');
	const conversation = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, session.userID)),
		with: {
			messages: {
				where: (table, { eq, not }) => not(eq(table.deleted, true)),
				orderBy: (table, { asc }) => [asc(table.order)],
				with: { prompt: true }
			},
			media: {
				orderBy: (table, { asc }) => [asc(table.order)],
				with: {
					original: true,
					thumbnail: true
				}
			}
		}
	});

	if (!conversation) error(404, 'Conversation not found or does not belong to the user');

	// Sanity check. Messages and Media attached to the conversation should have the same user id.
	for (const m of conversation.messages) {
		if (m.userID !== conversation.userID) throw new Error('Message user ID mismatch');
	}

	for (const m of conversation.media as MediaInterface[]) {
		if (m.userID !== conversation.userID) throw new Error('Media user ID mismatch');
		if (m.original && m.original?.userID !== conversation.userID)
			throw new Error("Media file 'original' user ID mismatch");

		if (m.original && m.original.size > 0) m.original.url = await getDownloadURL(m.original);
		if (m.thumbnail && m.thumbnail.size > 0) m.thumbnail.url = await getDownloadURL(m.thumbnail);

		debug('media: %o', m);
	}

	return conversation;
}

export async function  DBupsertConversation({
	session,
	conversation
}: {
	session?: SessionInterface;
	conversation: ConversationInterface;
}) {
	if (!session) error(401, 'Unauthorized');
	if (conversation.userID != session.userID)
		error(401, 'Tried to update a conversation that does not belong to the user');

	conversation = conversationInterfaceFilter(conversation);
	if (conversation.summary) conversation.summary = trimLineLength(conversation.summary, 128);

	if (conversation.id) {
		const update = await db
			.update(conversationsTable)
			.set(conversation)
			.where(and(eq(conversationsTable.id, conversation.id), eq(conversationsTable.userID, conversation.userID)))
			.returning();

		if (!update.length) {
			error(403, 'Tried to update a conversation that does not exist or does not belong to the user');
		}

		return update[0];
	}

	const insert = await db.insert(conversationsTable).values(conversation).onConflictDoNothing().returning();

	if (!insert || !insert.length) error(500, 'Failed to update conversation');

	return insert[0];
}

export async function DBdeleteConversations({ session, ids }: { session?: SessionInterface; ids: string[] }) {
	if (!session) error(401, 'Unauthorized');
	if (!Array.isArray(ids) || ids.length === 0) error(400, 'At least one conversation ID is required');

	const res = await db
		.delete(conversationsTable)
		.where(and(inArray(conversationsTable.id, ids), eq(conversationsTable.userID, session.userID)))
		.returning({ id: conversationsTable.id });
	debug('delete conversation res: %o', res);
	if (!res.length) error(500, 'Failed to delete conversation');

	return res;
}
