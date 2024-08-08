import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { apiKeysTable } from '../schema';

export async function DBgetKeys(userID: string) {
	const keys = await db.query.providersTable.findMany({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		columns: {},
		with: {
			apiKeys: true
		}
	});

	return keys;
}

export async function DBgetKey(id: string, userID: string) {
	const key = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		with: {
			apiKeys: {
				where: (table, { eq }) => eq(table.id, id)
			}
		}
	});

	if (!key) {
		error(404, 'Key not found or does not belong to the user');
	}

	return key;
}

export async function DBupsertKey(key: KeyInterface, userID: string) {
	key = undefineExtras(key);
	if (key.id) {
		// Check the key belongs to the user
		const userProviders = await db.query.providersTable.findFirst({
			where: (table, { eq, and }) => and(eq(table.id, key.providerID), eq(table.userID, userID)),
			columns: { id: true }
		});

		if (!userProviders) {
			error(403, 'Tried to update a key for a provider that does not belong to the user');
		}

		const update = await db.update(apiKeysTable).set(key).where(eq(apiKeysTable.id, key.id)).returning();

		if (!update?.length) {
			error(403, 'Failed to update key');
		}

		return update[0];
	}

	const insert = await db.insert(apiKeysTable).values(key).onConflictDoNothing().returning();

	if (!insert || !insert.length) {
		error(500, 'Failed to insert key');
	}

	return insert[0];
}

export async function DBdeleteKey(id: string, userID: string) {
	const userProviders = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID),
		columns: {},
		with: {
			apiKeys: {
				columns: { id: true }
			}
		}
	});

	if (!userProviders) {
		error(403, 'Tried to delete a key, but the user has no providers');
	}

	// Check the key belongs to the user and delete it.

	if (userProviders.some((provider) => provider.apiKeys?.some((key) => key.id === id))) {
		const res = await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id)).returning({ id: apiKeysTable.id });
		if (!res) {
			error(500, 'Failed to delete key');
		}
	}
}
