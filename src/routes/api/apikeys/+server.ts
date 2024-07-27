import { db } from '$lib/db';
import { providersTable, apiKeysTable } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { type uuid } from 'drizzle-orm/pg-core';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	let apiKeys = (await request.json()) as (typeof apiKeysTable.$inferInsert)[];
	console.log('apikeys PUT data', { apiKeys, locals });

	const user = locals.user;
	if (!user) {
		error(401, 'Unauthorized');
	}

	const allowedProviders = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, user.id),
		columns: { id: true }
	});

	const allowedProviderIds = new Set(allowedProviders.map((provider) => provider.id));

	for (const key of apiKeys) {
		if (key.id !== null && !allowedProviderIds.has(key.provider)) {
			error(403, 'Unauthorized: Attempt to modify keys for providers not owned by the user');
		}
	}

	apiKeys = apiKeys.map(({ id, provider, label, key }) => {
		return {
			id,
			provider,
			label,
			key
		};
	});

	const tx = await db.transaction(async (tx) => {
		const deltedRows = await tx
			.delete(apiKeysTable)
			.where(
				notInArray(
					apiKeysTable.id,
					apiKeys.filter((key) => key.id).map((key) => key.id)
				)
			)
			.returning();

		console.log('apikeys PUT deltedRows', { deltedRows });

		const updatedRows = await tx
			.insert(apiKeysTable)
			.values(apiKeys)
			.onConflictDoUpdate({
				target: apiKeysTable.id,
				set: {
					provider: sql`excluded."provider"`,
					label: sql`excluded."label"`,
					key: sql`excluded."key"`
				}
			})
			.returning();

		console.log('apikeys PUT updatedRows', { updatedRows });

		return {
			deleted: deltedRows,
			updated: updatedRows
		};
	});

	// console.log('PUT allowedProviders', { allowedProviderrs: allowedProviders, apiKeys });

	// console.log('PUT res', { res });

	return json(tx);
};
