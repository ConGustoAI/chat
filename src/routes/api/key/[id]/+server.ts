import { DBdeleteKey, DBgetKey, DBupsertKey } from '$lib/db/utils/keys';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:key/:id');

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const key = await request.json();
	debug('POST %o <- %o', id, key);

	if (key.id && key.id !== id) {
		error(400, 'Key ID in URL does not match the ID in body');
	}

	const updatedKey = await DBupsertKey(key, user.id);
	debug('POST %o -> %o', id, updatedKey);
	return json(updatedKey);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Key ID is required');
	}

	debug('GET <- %o', id);
	const key = await DBgetKey(id, user.id);
	debug('GET %o -> %o', id, key);
	return json(key);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	debug('DELETE %o', id);
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Key ID is required');
	}

	const res = await DBdeleteKey(id, user.id);
	debug('DELETE %o -> %o', id, res);
	return json({ res });
};
