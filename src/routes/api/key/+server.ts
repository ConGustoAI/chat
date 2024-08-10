import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetKeys, DBupsertKey } from '$lib/db/utils/keys';
import dbg from 'debug';

const debug = dbg('/api/key');

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const key = await request.json();
	debug('POST <- ', key);

	if (key.id) {
		error(400, 'ID should not be set for a new key');
	}

	const updated = await DBupsertKey(key, user.id);
	debug('POST -> ', updated);
	return json(updated);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	debug('GET');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const keys = await DBgetKeys(user.id);
	debug('GET -> ', keys);
	return json(keys);
};