import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetUser, DBupdateUser } from '$lib/db/utils/users';
import dbg from 'debug';

const debug = dbg('app:api:user');

export const POST: RequestHandler = async ({ request, locals: { session } }) => {
	const updatedUser = await request.json();

	debug('POST <- %o', updatedUser);
	const update = await DBupdateUser({ session, updatedUser });
	debug('POST -> %o', update);

	return json(update);
};

export const GET: RequestHandler = async ({ locals: { session } }) => {
	debug('GET <- %o', session?.userID);
	if (!session) return error(401, 'Unauthorized');

	const userData = await DBgetUser({ id: session.userID });
	debug('GET -> %o', userData);

	return json(userData);
};
