import { DBdeleteKey, DBgetKeys, DBupsertKey } from '$lib/db/utils/keys';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';
import { defaultsUUID } from '$lib/db/schema';

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
	let keys = await DBgetKeys({ dbUser });
	keys = keys.map((k) => {
		return {
			...k,
			key: k.userID === defaultsUUID ? `${k.key.slice(0, 5)}...${k.key.slice(-5)}` : k.key
		};
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
