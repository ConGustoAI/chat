import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { info } from 'console';
import { DBgetKeys, DBupsertKey } from '$lib/db/utils/keys';

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const key = await request.json();

	if (key.id) {
		return error(400, 'ID should not be set for a new key');
	}

	const updatedKey = await DBupsertKey(key, user.id);
	return json(updatedKey);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	info('GET /api/key');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const keys = await DBgetKeys(user.id);
	info('GET /api/providers', keys);
	return json(keys);
};
