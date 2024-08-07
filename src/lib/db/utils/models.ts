import { error } from '@sveltejs/kit';
import { db } from '../index';
import { modelsTable } from '../schema';
import { undefineExtras } from '$lib/utils';
import { eq, sql } from 'drizzle-orm';

export async function DBgetModels(userID: string) {
	const models = await db.query.providersTable.findMany({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		columns: {},
		with: {
			models: true
		}
	});

	return models;
}

export async function DBgetModel(id: string, userID: string) {
	const model = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		with: {
			models: {
				where: (table, { eq }) => eq(table.id, id)
			}
		}
	});

	if (!model) {
		error(404, 'Model not found or does not belong to the user');
	}

	return model;
}

export async function DBupsertModel(model: ModelInterface, userID: string) {
	if (model.id) {
		// Check the model belongs to the user
		const userProviders = await db.query.providersTable.findFirst({
			where: (table, { eq, and }) => and(eq(table.id, model.providerID), eq(table.userID, userID)),
			columns: { id: true }
		});

		if (!userProviders) {
			error(403, 'Tried to update a model for a provider that does not belong to the user');
		}
	}
	model = undefineExtras(model);

	console.log(model);

	const insertionResult = await db
		.insert(modelsTable)
		.values(undefineExtras(model))
		.onConflictDoUpdate({
			target: [modelsTable.id],
			set: {
				id: sql`excluded.id`,
				name: sql`excluded.name`,
				displayName: sql`excluded.display_name`,
				images: sql`excluded.images`,
				prefill: sql`excluded.prefill`,
				inputContext: sql`excluded.input_context`,
				providerID: sql`excluded.provider`
			}
		})
		.returning();

	if (!insertionResult || !insertionResult.length) {
		error(500, 'Failed to update model');
	}

	return insertionResult[0];
}

export async function DBdeleteModel(id: string, userID: string) {
	const userProviders = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID),
		columns: {},
		with: {
			models: {
				columns: { id: true }
			}
		}
	});

	if (!userProviders) {
		error(403, 'Tried to delete a model, but the user has no providers');
	}

	// Check the model belongs to the user and delete it.

	if (userProviders.some((provider) => provider.models?.some((model) => model.id === id))) {
		const res = await db.delete(modelsTable).where(eq(modelsTable.id, id)).returning({ id: modelsTable.id });
		if (!res) {
			error(500, 'Failed to delete model');
		}
	}
}
