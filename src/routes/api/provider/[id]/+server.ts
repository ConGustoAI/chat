import { DBgetProvider } from '$lib/db/utils/providers';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import dbg from 'debug';

const debug = dbg('app:api:provider:id');

export const GET: RequestHandler = async ({ locals: { session }, params: { id } }) => {
	debug('GET %o', id);
	const assistant = await DBgetProvider({ session, id });
	debug('GET %o -> %o', id, assistant);

	return json(assistant);
};
