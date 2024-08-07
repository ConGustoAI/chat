import { DBdeleteKey, DBgetKey, DBupsertKey } from '$lib/db/utils/keys';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const key = await request.json();

	if (key.id && key.id !== id) {
		return error(400, 'Key ID in URL does not match the ID in body');
	}

	const updatedKey = await DBupsertKey(key, user.id);
	return json(updatedKey);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Key ID is required');
	}

	const key = await DBgetKey(id, user.id);
	return json(key);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Key ID is required');
	}

	const res = await DBdeleteKey(id, user.id);
	return json({ res });
};
