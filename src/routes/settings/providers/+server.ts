// import { db } from '$lib/db';
// import { providersTable, apiKeysTable } from '$lib/db/schema';
// import type { RequestHandler } from '@sveltejs/kit';
// import { error } from '@sveltejs/kit';
// import { notInArray, sql } from 'drizzle-orm';

// export const POST: RequestHandler = async ({ request, locals }) => {
// 	const providers = (await request.json()) as ProviderApiKeysInterface[];
// 	console.log('POST data', { data: providers, locals });

// 	const user = locals.user;
// 	if (!user) {
// 		error(401, 'Unauthorized');
// 	}

// 	await db.transaction(async (tx) => {

// 		const usersProviders = await db.query.providersTable.findMany({
// 			where: (table, { eq }) => eq(table.userID, user.id),
// 			columns: { id: true }
// 		});

// 		providers.forEach((provider) => {
// 			if (provider.id && !usersProviders.some((p) => p.id === provider.id)) {
// 				error(403, 'Tried to update a provider that does not belong to the user');
// 			}
// 		});

// 		const updatedProviderIds = await tx
// 			.insert(providersTable)
// 			.values(providers.map(({ id, name, type, baseURL }) => ({ id, userID: user.id, name, type, baseURL })))
// 			.onConflictDoUpdate({
// 				target: providersTable.id,
// 				set: {
// 					name: sql`excluded.name`,
// 					type: sql`excluded.type`,
// 					baseURL: sql`excluded.base_url`
// 				}
// 			})
// 			.returning({ id: providersTable.id });

// 		console.log('POST updatedIds', { updatedIds: updatedProviderIds });
// 		if (updatedProviderIds.length !== providers.length) {
// 			error(502, 'Could not update providers');
// 		}

// 		// Delete providers that were not in the list
// 		const deletedProviders = await tx
// 			.delete(providersTable)
// 			.where(
// 				notInArray(
// 					providersTable.id,
// 					updatedProviderIds.map((id) => id.id)
// 				)
// 			)
// 			.returning({ id: providersTable.id });

// 		console.log('POST deletedProviders', { deletedProviders });

// 		// Update the providers list with ids
// 		for (let i = 0; i < providers.length; i++) {
// 			if (!providers[i].id) {
// 				providers[i].id = updatedProviderIds[i].id;
// 			} else {
// 				if (providers[i].id !== updatedProviderIds[i].id) {
// 					error(502, 'Provider ID mismatch');
// 				}
// 			}
// 		}

// 		// Update each provider's apiKeys with the providerID
// 		const flattenedApiKeys = providers.flatMap((provider) =>
// 			provider.apiKeys.map((apiKey) => ({
// 				...apiKey,
// 				providerID: provider.id!
// 			}))
// 		);

// 		// Insert or update the API keys
// 		const updatedApiKeys = await tx
// 			.insert(apiKeysTable)
// 			.values(flattenedApiKeys)
// 			.onConflictDoUpdate({
// 				target: [apiKeysTable.id],
// 				set: {
// 					providerID: sql`excluded.provider`,
// 					label: sql`excluded.label`,
// 					key: sql`excluded.key`
// 				}
// 			})
// 			.returning({ id: apiKeysTable.id });

// 		//

// 		console.log('POST updatedApiKeys', { updatedApiKeys });
// 		if (updatedApiKeys.length !== flattenedApiKeys.length) {
// 			error(502, 'Could not update API keys');
// 		}
// 	});


// 	return new Response();
// };
