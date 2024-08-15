import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { defaultsUUID, modelsTable } from '../schema';

export async function DBgetModels({ dbUser }: { dbUser?: UserInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	const models = await db.query.modelsTable.findMany({
		where: (table, { eq, or }) => or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID))
	});

	return models;
}

export async function DBgetModel({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	if (!dbUser) error(401, 'Unauthorized');
	const model = await db.query.modelsTable.findFirst({
		where: (table, { eq, or, and }) =>
			and(eq(table.id, id), or(eq(table.userID, dbUser.id), eq(table.userID, defaultsUUID)))
	});

	if (!model) error(404, 'Model not found or does not belong to the user');

	return model;
}

export async function DBupsertModel({ dbUser, model }: { dbUser?: UserInterface; model: ModelInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (model.userID != dbUser.id && (!dbUser.admin || model.userID !== defaultsUUID))
		error(401, 'Tried to update a model that does not belong to the user');

	model = undefineExtras(model);
	if (model.id) {
		const update = await db
			.update(modelsTable)
			.set(model)
			.where(and(eq(modelsTable.id, model.id), eq(modelsTable.userID, model.userID)))
			.returning();
		if (!update.length) error(403, 'Failed to update model');
		return update[0];
	}

	const insert = await db.insert(modelsTable).values(model).onConflictDoNothing().returning();
	if (!insert || !insert.length) error(500, 'Failed to update model');

	return insert[0];
}

export async function DBdeleteModel({ dbUser, model }: { dbUser?: UserInterface; model: ModelInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!model.id) error(400, 'Model ID is required');
	if (model.userID != dbUser.id && (!dbUser.admin || model.userID !== defaultsUUID))
		error(401, 'Tried to delete a model that does not belong to the user');

	const del = await db
		.delete(modelsTable)
		.where(and(eq(modelsTable.id, model.id), eq(modelsTable.userID, model.userID)))
		.returning({ id: modelsTable.id });
	if (!del.length) error(500, 'Failed to delete model');
	return del[0];
}
