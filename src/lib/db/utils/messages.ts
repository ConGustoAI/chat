import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../index';
import { defaultsUUID, messagesTable } from '../schema';
import { messageInterfaceFilter } from '$lib/api';
import dbg from 'debug';

const debug = dbg('app:db:utils:messages');

export async function DBgetMessage({ session, id }: { session?: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');
	const message = await db.query.messagesTable.findFirst({
		where: (table, { eq, and, or }) =>
			and(eq(table.id, id), or(eq(table.userID, session.userID), eq(table.userID, defaultsUUID))),
		with: { prompt: true }
	});

	if (!message) error(404, 'Message not found');

	// Sanity check

	return message;
}

export async function DBupsertMessages({ session, messages }: { session?: SessionInterface; messages: MessageInterface[] }) {
	debug('DBupsertMessages', session);
	if (!session) error(401, 'Unauthorized');
	if (!messages.length) error(400, 'Messages array is required');

	// I don't think we can db.update() multiple messages at the same time, so we'll use Promise.all
	const result = await Promise.all(
		messages.map((message) => DBupsertMessage({ session, message: messageInterfaceFilter(message) }))
	);

	if (result.length != messages.length) error(500, 'Failed to upsert all messages');
	return result;
}

export async function DBupsertMessage({
	session,
	message
}: {
	session?: SessionInterface;
	message: MessageInterface;
}): Promise<MessageInterface> {
	if (!session) error(401, 'Unauthorized');
	if (message.userID !== session.userID && (!session.user?.admin || message.userID !== defaultsUUID))
		error(401, 'Tried to update a message that does not belong to the user');

	if (!message.conversationID) error(400, 'Conversation ID is required');

	message = messageInterfaceFilter(message);
	if (message.id) {
		// Check that the message belongs to the user
		const update = await db
			.update(messagesTable)
			.set(message)
			.where(and(eq(messagesTable.id, message.id), eq(messagesTable.userID, message.userID)))
			.returning();
		if (!update?.length) error(403, 'Failed to update message');

		return update[0] as MessageInterface;
	}

	const insert = await db
		.insert(messagesTable)
		// @ts-expect-error - We check for conversationID above
		.values(message)
		.onConflictDoNothing()
		.returning();

	if (!insert || !insert.length) error(500, 'Failed to insert message');
	return insert[0] as MessageInterface;
}

export async function DBmarkDeletedMessage({ session, ids }: { session?: SessionInterface; ids: string[] }) {
	if (!session) error(401, 'Unauthorized');
	if (!ids.length) error(400, 'Messages array is required');

	const res = await db
		.update(messagesTable)
		.set({ deleted: true })
		.where(and(inArray(messagesTable.id, ids), eq(messagesTable.userID, session.userID))).returning({id: messagesTable.id})

	const deletedIds = res.map((r) => r.id)
	if (!deletedIds.length) error(400, "No messages deleted")
	if (deletedIds.length != ids.length) debug("Not all messages were deleted")

	return deletedIds;
}

export async function DBdeleteMessage({ session, message }: { session?: SessionInterface; message: MessageInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (!message.id) error(400, 'Message ID is required');
	if (message.userID !== session.userID && (!session.user?.admin || message.userID !== defaultsUUID))
		error(401, 'Tried to delete a message that does not belong to the user');

	const del = await db
		.delete(messagesTable)
		.where(and(eq(messagesTable.id, message.id), eq(messagesTable.userID, message.userID)))
		.returning({ id: messagesTable.id });

	if (!del.length) error(500, 'Failed to delete message');
	return del[0];
}
