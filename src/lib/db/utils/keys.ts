import { apiKeyInterfaceFilter } from '$lib/api';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { apiKeysTable, defaultsUUID } from '../schema';

export async function DBgetKeys({ session }: { session?: SessionInterface }) {
	// Note: If the user is not authorized, we only return the default keys.
	// The default keys values are censored, and an anonymous user can not use
	// the chat, so it's just to demo the settings page.
	const keys = await db.query.apiKeysTable.findMany({
		where: (table, { eq, or }) => or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)),
		orderBy: (table, { asc }) => asc(table.label)
	});

	return keys;
}

export async function DBgetKey({ session, id }: { session?: SessionInterface; id: string }) {
	// Note: If the user is not authorized, we only return the default keys.
	// The default keys values are censored, and an anonymous user can not use
	// the chat, so it's just to demo the settings page.
	const key = await db.query.apiKeysTable.findFirst({
		where: (table, { eq, or, and }) =>
			and(eq(table.id, id), or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)))
	});

	if (!key) error(404, 'Key not found or does not belong to the user');
	return key;
}

export async function DBupsertKey({ session, key }: { session?: SessionInterface; key: ApiKeyInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (key.userID != session.userID && (!session.user?.admin || key.userID !== defaultsUUID))
		error(401, 'Tried to update a key that does not belong to the user');

	key = apiKeyInterfaceFilter(key);
	if (key.id) {
		const update = await db
			.update(apiKeysTable)
			.set(key)
			.where(and(eq(apiKeysTable.id, key.id), eq(apiKeysTable.userID, key.userID)))
			.returning();

		if (!update.length) error(403, 'Failed to update key');

		return update[0];
	}

	const insert = await db.insert(apiKeysTable).values(key).onConflictDoNothing().returning();
	if (!insert || !insert.length) error(500, 'Failed to insert key');

	return insert[0];
}

export async function DBdeleteKey({ session, key }: { session?: SessionInterface; key: ApiKeyInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (!key.id) error(400, 'Key ID is required');
	if (key.userID != session.userID && (!session.user?.admin || key.userID !== defaultsUUID))
		error(401, 'Tried to delete a key that does not belong to the user');

	const del = await db
		.delete(apiKeysTable)
		.where(and(eq(apiKeysTable.id, key.id), eq(apiKeysTable.userID, key.userID)))
		.returning({ id: apiKeysTable.id });
	if (!del.length) error(500, 'Failed to delete key');
	return del[0];
}
