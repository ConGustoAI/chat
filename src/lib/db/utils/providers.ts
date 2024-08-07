import { error } from 'console';
import { db } from '..';
import { providersTable } from '../schema';
import { and, eq, sql } from 'drizzle-orm';
import { undefineExtras } from '$lib/utils';

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
	const updatedProvider = await db.transaction(async (tx) => {
		if (provider.id) {
			// Check the provider belongs to the user
			const userProviders = await tx.query.providersTable.findFirst({
				where: (table, { eq, and }) => and(eq(table.id, provider.id!), eq(table.userID, userID)),
				columns: { id: true }
			});

			if (!userProviders) {
				error(403, 'Tried to update a provider that does not belong to the user');
			}
		} else {
			provider.userID = userID;
		}

		provider = undefineExtras(provider);

		const insertionResult = await tx
			.insert(providersTable)
			// @ts-expect-error provider.userID is not undefined here.
			.values(undefineExtras(provider))
			.onConflictDoUpdate({
				target: [providersTable.id],
				set: {
					id: sql`excluded.id`,
					name: sql`excluded.name`,
					type: sql`excluded.type`,
					baseURL: sql`excluded.base_url`,
					userID: sql`excluded.user_id`
				}
			})
			.returning();

		if (!insertionResult || insertionResult.length === 0) {
			error(500, 'Failed to update provider');
		}

		return insertionResult[0];
	});

	return updatedProvider;
}
