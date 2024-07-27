import { db } from '$lib/db';
import { providersTable, apiKeysTable } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

// export const POST: RequestHandler = async ({ request }) => {
// 	const data = await request.json();
// 	console.log('POST data', data);

// 	const id = data.get('providerID');
// 	if (id) {
// 		error(400, 'New provider with a non-null id received');
// 	}

// 	const name = data.get('name');
// 	const type = data.get('type');
// 	const baseURL = data.get('baseURL');

// 	console.log('default action', { id, name, type, baseURL });

// 	return new Response();
// 	// return { success: true };
// };

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();
	console.log('PUT data', { data, locals });

	const user = locals.user;
	if (!user) {
		error(401, 'Unauthorized');
	}

	const allowedProviders = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, user.id),
		columns: { id: true }
	});

	console.log('PUT allowedProviders', { allowedProviderrs: allowedProviders });

	// const name = data.name;
	// const type = data.type;
	// const baseURL = data.baseURL;
	// const apiKeys = data.apiKeys as typeof apiKeysTable.$inferInsert[];

	// const tx = await db.transaction( async (tx) => {
	// 	const rowList = await tx
	// 		.update(providersTable)
	// 		.set({
	// 			name,
	// 			type,
	// 			baseURL
	// 		})
	// 		.where(and(
	// 			eq(providersTable.id, data.id),
	// 			eq(providersTable.userID, user.id)
	// 		));

	// 	if (rowList.length === 0) {
	// 		error(502, "Could not update provider");
	// 	}

	// 	// Separate API keys into those with IDs and those without
	// 	const existingApiKeys = apiKeys.filter(key => key.id);
	// 	const newApiKeys = apiKeys.filter(key => !key.id);

	// 	// Update existing API keys
	// 	for (const key of existingApiKeys) {
	// 		await tx
	// 			.update(apiKeysTable)
	// 			.set({
	// 				label: key.label,
	// 				key: key.key
	// 			})
	// 			.where(and(
	// 				eq(apiKeysTable.id, key.id!),
	// 				eq(apiKeysTable.provider, data.id)
	// 			));
	// 	}

	// 	// Insert new API keys
	// 	if (newApiKeys.length > 0) {
	// 		await tx
	// 			.insert(apiKeysTable)
	// 			.values(newApiKeys.map(key => ({
	// 				provider: data.id,
	// 				label: key.label,
	// 				key: key.key
	// 			})));
	// 	}
	// }

	// // const res = await db
	// // 	.update(providersTable)
	// // 	.set({
	// // 		name,
	// // 		type,
	// // 		baseURL
	// // 	})
	// // 	.where(eq(providersTable.id, data.id));

	// console.log('PUT res', res);

	return new Response();
	// return { success: true };
};
