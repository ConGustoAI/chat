import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetUser, DBupdateUser } from '$lib/db/utils/users';
import dbg from 'debug';

const debug = dbg('/api/user');

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	debug('POST');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const userData = await request.json();
	debug('POST <- ', userData);

	if (!userData.id) {
		error(400, 'ID should not set');
	}

	if (userData.id !== user.id) {
		error(400, 'Tried to update a different user');
	}

	const updatedUserData = await DBupdateUser(userData);
	debug('POST -> ', updatedUserData);
	return json(updatedUserData);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	debug('GET');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const userData = await DBgetUser(user.id);
	debug('GET -> ', userData);
	return json(userData);
};
