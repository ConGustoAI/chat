import { DBdeleteModel, DBgetModel, DBupsertModel } from '$lib/db/utils/models';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:model/id');

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const model = await request.json();
	debug('POST %o <- %o', id, model);

	if (model.id && model.id !== id) {
		error(400, 'Model ID in URL does not match the ID in body');
	}

	const updatedModel = await DBupsertModel(model, user.id);
	debug('POST %o -> %o', id, updatedModel);
	return json(updatedModel);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Model ID is required');
	}

	debug('GET <- %o', id);
	const model = await DBgetModel(id, user.id);
	debug('GET %o -> %o', id, model);
	return json(model);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	debug('DELETE %o', id);
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Model ID is required');
	}

	const res = await DBdeleteModel(id, user.id);
	debug('DELETE %o -> %o', id, res);
	return json(res);
};
