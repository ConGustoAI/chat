import { undefineExtras } from '$lib/utils';
import { and, eq, or } from 'drizzle-orm';
import { db } from '..';
import { defaultsUUID, providersTable } from '../schema';
import { error } from '@sveltejs/kit';

export async function DBgetProviders({ dbUser }: { dbUser?: UserInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	const providers = await db.query.providersTable.findMany({
		where: (table, { eq, or }) => or(eq(table.userID, dbUser!.id), eq(table.userID, defaultsUUID))
	});

	return providers;
}

export async function DBgetProvider({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	if (!dbUser) error(401, 'Unauthorized');
	const provider = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) =>
			and(eq(table.id, id), or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID)))
	});

	if (!provider) error(404, 'Provider not found or does not belong to the user');
	return provider;
}

export async function DBupsertProvider({ dbUser, provider }: { dbUser?: UserInterface; provider: ProviderInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (provider.userID != dbUser.id && (!dbUser.admin || provider.userID !== defaultsUUID))
		error(401, 'Tried to delete a provider that does not belong to the user');

	provider = undefineExtras(provider);
	if (provider.id) {
		const update = await db
			.update(providersTable)
			.set(provider)
			.where(and(eq(providersTable.id, provider.id), eq(providersTable.userID, provider.userID)))
			.returning();

		if (!update.length) error(403, 'Tried to update a provider that does not exist or does not belong to the user');
		return update[0];
	}

	const insert = await db.insert(providersTable).values(provider).onConflictDoNothing().returning();

	if (!insert.length) error(500, 'Failed to update provider');
	return insert[0];
}

export async function DBdeleteProvider({ dbUser, provider }: { dbUser?: UserInterface; provider: ProviderInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!provider.id) error(400, 'Provider ID is required');
	if (provider.userID != dbUser.id && (!dbUser.admin || provider.userID !== defaultsUUID))
		error(401, 'Tried to delete a provider that does not belong to the user');

	const res = await db
		.delete(providersTable)
		.where(and(eq(providersTable.id, provider.id!), eq(providersTable.userID, provider.userID)))
		.returning({ id: providersTable.id });

	if (!res.length) error(500, 'Failed to delete provider');
	return res[0];
}
