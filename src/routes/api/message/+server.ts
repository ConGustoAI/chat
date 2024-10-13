import { DBmarkDeletedMessage, DBupsertMessage } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { error } from 'console';
import dbg from 'debug';

const debug = dbg('app:api:message');

export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const message = await request.json();

	debug('POST <- %o', message);
	const updated = await DBupsertMessage({ dbUser, message });
	debug('POST -> %o', updated);

	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals: { dbUser }, request }) => {
	const ids = (await request.json()) as string[];
	if (!Array.isArray(ids) || ids.length === 0) error(400, 'At least one message ID is required');

	debug('DELETE %o', {ids, dbUser});
	const del = await DBmarkDeletedMessage({dbUser, ids})
	debug('DELETE -> %o', del);

	return json(del);
};
