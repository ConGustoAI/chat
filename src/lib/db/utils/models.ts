import { modelInterfaceFilter } from '$lib/api';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { defaultsUUID, modelsTable } from '../schema';

export async function DBgetModels({ session }: { session?: SessionInterface }) {
	// Note: If the user is not authorized, we only return the default models.
	const models = await db.query.modelsTable.findMany({
		where: (table, { eq, or }) =>
			or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)),
		orderBy: (table, { asc }) => asc(table.name)
	});

	return models;
}

export async function DBgetModel({ session, id }: { session?: SessionInterface; id: string }) {
	// Note: If the user is not authorized, we only return the default models.
	const model = await db.query.modelsTable.findFirst({
		where: (table, { eq, or, and }) =>
			and(eq(table.id, id), or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)))
	});

	if (!model) error(404, 'Model not found or does not belong to the user');

	return model;
}

export async function DBupsertModel({ session, model }: { session?: SessionInterface; model: ModelInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (model.userID != session.userID && (!session.user?.admin || model.userID !== defaultsUUID))
		error(401, 'Tried to update a model that does not belong to the user');

	model = modelInterfaceFilter(model);
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

export async function DBdeleteModel({ session, model }: { session?: SessionInterface; model: ModelInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (!model.id) error(400, 'Model ID is required');
	if (model.userID != session.userID && (!session.user?.admin || model.userID !== defaultsUUID))
		error(401, 'Tried to delete a model that does not belong to the user');

	const del = await db
		.delete(modelsTable)
		.where(and(eq(modelsTable.id, model.id), eq(modelsTable.userID, model.userID)))
		.returning({ id: modelsTable.id });
	if (!del.length) error(500, 'Failed to delete model');
	return del[0];
}
