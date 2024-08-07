import { DBdeleteModel, DBgetModel, DBupsertModel } from '$lib/db/utils/models';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const model = await request.json();

	if (model.id && model.id !== id) {
		return error(400, 'Model ID in URL does not match the ID in body');
	}

	const updatedKey = await DBupsertModel(model, user.id);
	return json(updatedKey);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Model ID is required');
	}

	const model = await DBgetModel(id, user.id);
	return json(model);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Model ID is required');
	}

	const res = await DBdeleteModel(id, user.id);
	return json(res);
};
