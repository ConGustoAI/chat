import { providerInterfaceFilter } from '$lib/api';
import { error } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';
import { db } from '..';
import { defaultsUUID, providersTable } from '../schema';

export async function DBgetProviders({ session }: { session?: SessionInterface }) {
	// Note: If the user is not authorized, we only return the default providers.
	const providers = await db.query.providersTable.findMany({
		where: (table, { eq, or }) => or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)),
		orderBy: (table, { asc }) => asc(table.name)
	});

	return providers;
}

export async function DBgetProvider({ session, id }: { session?: SessionInterface; id: string }) {
	// Note: If the user is not authorized, we only return the default providers.
	const provider = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) =>
			and(eq(table.id, id), or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)))
	});

	if (!provider) error(404, 'Provider not found or does not belong to the user');
	return provider;
}

export async function DBupsertProvider({ session, provider }: { session?: SessionInterface; provider: ProviderInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (provider.userID != session.userID && (!session.user?.admin || provider.userID !== defaultsUUID))
		error(401, 'Tried to delete a provider that does not belong to the user');

	provider = providerInterfaceFilter(provider);
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

export async function DBdeleteProvider({ session, provider }: { session?: SessionInterface; provider: ProviderInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (!provider.id) error(400, 'Provider ID is required');
	if (provider.userID != session.userID && (!session.user?.admin || provider.userID !== defaultsUUID))
		error(401, 'Tried to delete a provider that does not belong to the user');

	const res = await db
		.delete(providersTable)
		.where(and(eq(providersTable.id, provider.id!), eq(providersTable.userID, provider.userID)))
		.returning({ id: providersTable.id });

	if (!res.length) error(500, 'Failed to delete provider');
	return res[0];
}
