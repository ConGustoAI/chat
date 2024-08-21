import { DBhideItem, DBunhideItem } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import dbg from 'debug';
const debug = dbg('app:api:hidden:id');

export const DELETE: RequestHandler = async ({ locals: { dbUser }, params: { id } }) => {
	debug('DELETE <- %o', id);
	const deleted = await DBunhideItem({ dbUser, itemID: id });
	debug('DELETE -> %o', deleted);
	return json(deleted);
};

export const POST: RequestHandler = async ({ locals: { dbUser }, params: { id } }) => {
	debug('POST <- %o', id);
	const inserted = await DBhideItem({ dbUser, itemID: id });
	debug('POST -> %o', inserted);
	return json(inserted);
};
