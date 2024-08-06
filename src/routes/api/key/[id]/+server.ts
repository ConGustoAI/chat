import { error, json, type RequestHandler } from '@sveltejs/kit';

import { S_deleteKey, S_getKey, S_upsertKey } from '$lib/api-server';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const key = await request.json();

	if (key.id && key.id !== id) {
		return error(400, 'Key ID in URL does not match the ID in body');
	}

	const updatedKey = await S_upsertKey(key, user.id);
	return json(updatedKey);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Key ID is required');
	}

	const assistant = await S_getKey(id, user.id);
	return json(assistant);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Key ID is required');
	}

	await S_deleteKey(id, user.id);
	return json({ id });
};
