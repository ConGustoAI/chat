import { DBdeleteMessage, DBupsertMessage } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
	const message = await request.json();

	debug('DELETE %o', message);
	const del = await DBdeleteMessage({ dbUser, message });
	debug('DELETE -> %o', del);

	return json(del);
};
