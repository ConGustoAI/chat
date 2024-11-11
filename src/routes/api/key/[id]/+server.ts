import { DBgetKey } from '$lib/db/utils/keys';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';
import { censorKey } from '$lib/utils/utils';

const debug = dbg('app:api:key/:id');

export const GET: RequestHandler = async ({ locals: { session }, params: { id } }) => {
	debug('GET <- %o', id);
	const key = censorKey(session, await DBgetKey({ session, id }));

	debug('GET %o -> %o', id, key);
	return json(key);
};
