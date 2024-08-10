import { DBdeleteModel, DBgetModel, DBupsertModel } from '$lib/db/utils/models';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('/api/model/[id]');

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const model = await request.json();
	debug(`POST ${id} <- `, model);

	if (model.id && model.id !== id) {
		error(400, 'Model ID in URL does not match the ID in body');
	}

	const updatedModel = await DBupsertModel(model, user.id);
	debug(`POST ${id} -> `, updatedModel);
	return json(updatedModel);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Model ID is required');
	}

	debug(`GET <- ${id}`);
	const model = await DBgetModel(id, user.id);
	debug(`GET ${id} -> `, model);
	return json(model);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	debug(`DELETE ${id}`);
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Model ID is required');
	}

	const res = await DBdeleteModel(id, user.id);
	debug(`DELETE ${id} -> `, res);
	return json(res);
};
