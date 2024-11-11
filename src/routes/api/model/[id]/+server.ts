import { DBgetModel } from '$lib/db/utils/models';
import { json } from '@sveltejs/kit';
import dbg from 'debug';

import type { RequestHandler } from './$types';

const debug = dbg('app:api:model:id');

export const GET: RequestHandler = async ({ locals: { session }, params: { id } }) => {
	debug('GET <- %o', id);
	const model = await DBgetModel({ session, id });
	debug('GET %o -> %o', id, model);

	return json(model);
};
