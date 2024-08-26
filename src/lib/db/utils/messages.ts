import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { defaultsUUID, messagesTable } from '../schema';

export async function DBgetMessage({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	if (!dbUser) error(401, 'Unauthorized');
	const message = await db.query.messagesTable.findFirst({
		where: (table, { eq, and, or }) =>
			and(eq(table.id, id), or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID))),
		with: { prompt: true }
	});

	if (!message) error(404, 'Message not found');
	return message;
}

export async function DBupsertMessages({ dbUser, messages }: { dbUser?: UserInterface; messages: MessageInterface[] }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!messages.length) error(400, 'Messages array is required');

	// I don't think we can db.update() multiple messages at the same time, so we'll use Promise.all
	const result = await Promise.all(messages.map((message) => DBupsertMessage({ dbUser, message: message })));

	if (result.length != messages.length) error(500, 'Failed to upsert all messages');
	return result;
}

export async function DBupsertMessage({ dbUser, message }: { dbUser?: UserInterface; message: MessageInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (message.userID !== dbUser.id && (!dbUser.admin || message.userID !== defaultsUUID))
		error(401, 'Tried to update a message that does not belong to the user');

	message = undefineExtras(message);
	if (message.id) {
		// Check that the message belongs to the user
		const update = await db
			.update(messagesTable)
			.set(message)
			.where(and(eq(messagesTable.id, message.id), eq(messagesTable.userID, message.userID)))
			.returning();
		if (!update?.length) error(403, 'Failed to update message');

		return update[0];
	}

	// @ts-expect-error - message.id is checked above
	const insert = await db.insert(messagesTable).values(message).onConflictDoNothing().returning();

	if (!insert || !insert.length) error(500, 'Failed to insert message');
	return insert[0];
}

export async function DBdeleteMessage({ dbUser, message }: { dbUser?: UserInterface; message: MessageInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!message.id) error(400, 'Message ID is required');
	if (message.userID !== dbUser.id && (!dbUser.admin || message.userID !== defaultsUUID))
		error(401, 'Tried to delete a message that does not belong to the user');

	const del = await db
		.delete(messagesTable)
		.where(and(eq(messagesTable.id, message.id), eq(messagesTable.userID, message.userID)))
		.returning({ id: messagesTable.id });

	if (!del.length) error(500, 'Failed to delete message');
	return del[0];
}
