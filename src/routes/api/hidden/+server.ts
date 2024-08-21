import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';
import { DBgetHiddenItems } from '$lib/db/utils';

const debug = dbg('app:api:hidden');

export const GET: RequestHandler = async ({ locals: { dbUser } }) => {
	debug('GET');
	const hiddenItems = await DBgetHiddenItems({ dbUser });
	debug('GET -> %o', hiddenItems);
	return json(Array.from(hiddenItems));
};
