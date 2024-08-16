import { DBdeleteKey, DBgetKeys, DBupsertKey } from '$lib/db/utils/keys';
import { censorKey } from '$lib/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:key');

export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const key = await request.json();

	debug('POST <- %o', key);
	const updated = await DBupsertKey({ dbUser, key });
	debug('POST -> %o', updated);
	return json(updated);
};

export const GET: RequestHandler = async ({ locals: { dbUser } }) => {
	debug('GET');
	const keys = (await DBgetKeys({ dbUser })).map((k) => {
		return censorKey(dbUser, k);
	});
	debug('GET -> %o', keys);
	return json(keys);
};

export const DELETE: RequestHandler = async ({ locals: { dbUser }, request }) => {
	const key = await request.json();

	debug('DELETE %o', key);
	const del = await DBdeleteKey({ dbUser, key });
	debug('DELETE -> %o', del);
	return json(del);
};
