import { DBgetKey } from '$lib/db/utils/keys';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';
import { censorKey } from '$lib/utils';

const debug = dbg('app:api:key/:id');

export const GET: RequestHandler = async ({ locals: { dbUser }, params: { id } }) => {
	debug('GET <- %o', id);
	const key = censorKey(dbUser, (await DBgetKey({ dbUser, id })))

	debug('GET %o -> %o', id, key);
	return json(key);
};
