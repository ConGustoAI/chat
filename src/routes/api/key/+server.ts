import { DBdeleteKey, DBgetKeys, DBupsertKey } from '$lib/db/utils/keys';
import { censorKey } from '$lib/utils/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:key');

export const POST: RequestHandler = async ({ request, locals: { session } }) => {
	const key = await request.json();

	debug('POST <- %o', key);
	const updated = await DBupsertKey({ session, key });
	debug('POST -> %o', updated);
	return json(updated);
};

export const GET: RequestHandler = async ({ locals: { session } }) => {
	debug('GET');
	const keys = (await DBgetKeys({ session })).map((k) => {
		return censorKey(session, k);
	});
	debug('GET -> %o', keys);
	return json(keys);
};

export const DELETE: RequestHandler = async ({ locals: { session }, request }) => {
	const key = await request.json();

	debug('DELETE %o', key);
	const del = await DBdeleteKey({ session, key });
	debug('DELETE -> %o', del);
	return json(del);
};
