import { undefineExtras } from '$lib/utils';
import { error } from 'console';
import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { providersTable } from '../schema';

export async function DBgetProviders(userID: string, withKeys: boolean, withModels: boolean) {
	const providers = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID),
		with: {
			...(withKeys && { apiKeys: true }),
			...(withModels && { models: true })
		}
	});

	return providers;
}

export async function DBgetProvider(id: string, userID: string) {
	const provider = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, userID))
	});

	if (!provider) {
		error(404, 'Provider not found or does not belong to the user');
	}

	return provider;
}

export async function DBdeleteProvider(id: string, userID: string) {
	const res = await db
		.delete(providersTable)
		.where(and(eq(providersTable.id, id), eq(providersTable.userID, userID)))
		.returning({ id: providersTable.id });
	if (!res) {
		error(500, 'Failed to delete provider');
	}
}

export async function DBupsertProvider(provider: ProviderInterface, userID: string) {
	provider = undefineExtras(provider);

	if (provider.id) {
		const update = await db
			.update(providersTable)
			.set(provider)
			.where(and(eq(providersTable.id, provider.id), eq(providersTable.userID, userID)))
			.returning();

		if (!update.length) error(403, 'Tried to update a provider that does not exist or does not belong to the user');
		return update[0];
	}

	provider.userID = userID;
	const insertionResult = await db
		.insert(providersTable)
		// @ts-expect-error provider.userID is not undefined here.
		.values(undefineExtras(provider))
		.onConflictDoNothing()
		.returning();

	if (!insertionResult.length) error(500, 'Failed to update provider');

	return insertionResult[0];
}
