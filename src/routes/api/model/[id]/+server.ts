import { error, json, type RequestHandler } from '@sveltejs/kit';

import { S_deleteKey, S_getKey, S_upsertKey } from '$lib/api-server';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const model = await request.json();

	if (model.id && model.id !== id) {
		return error(400, 'Model ID in URL does not match the ID in body');
	}

	const updatedKey = await S_upsertModel(model, user.id);
	return json(updatedKey);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Model ID is required');
	}

	const model = await S_getKey(id, user.id);
	return json(model);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Model ID is required');
	}

	await S_deleteModel(id, user.id);
	return json({ id });
};
