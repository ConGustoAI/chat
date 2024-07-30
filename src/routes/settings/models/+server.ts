import { db } from '$lib/db';
import { modelsTable } from '$lib/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const providers = (await request.json()) as ProviderModelsInterface[];
	console.log('POST data', { data: providers, locals });

	const user = locals.user;
	if (!user) {
		error(401, 'Unauthorized');
	}

	await db.transaction(async (tx) => {
		const usersProviders = await db.query.providersTable.findMany({
			where: (table, { eq }) => eq(table.userID, user.id),
			columns: { id: true }
		});

		providers.forEach(async (provider) => {
			if (provider.id && !usersProviders.some((p) => p.id === provider.id)) {
				error(403, 'Tried to update a model that does not belong to the user');
			}
		});

		// Update each provider's models with the providerID and flattn them into a single array
		const flattenedModels = providers.flatMap((provider) =>
			provider.models.map((model) => ({
				...model,
				providerID: provider.id!,
                display_name: model.display_name || model.name,
			}))
		);

		// Insert or update the API keys
		const updatedModesl = await tx
			.insert(modelsTable)
			.values(flattenedModels)
			.onConflictDoUpdate({
				target: [modelsTable.id],
				set: {
					providerID: sql`excluded.provider`,
                    display_name: sql`excluded.display_name`,
                    images: sql`excluded.images`,
                    prefill: sql`excluded.prefill`,
                    name: sql`excluded.name`,
                    inputContext: sql`excluded.input_context`,
				}
			})
			.returning({ id: modelsTable.id });


		console.log('POST models', { updatedApiKeys: updatedModesl });
		if (updatedModesl.length !== flattenedModels.length) {
			error(502, 'Could not update models');
		}
	});

	return new Response();
};
