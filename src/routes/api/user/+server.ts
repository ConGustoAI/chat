import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetUser, DBupdateUser } from '$lib/db/utils/users';
import dbg from 'debug';

const debug = dbg('app:api:user');

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	debug('POST');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const userData = await request.json();
	debug('POST <- %o', userData);

	if (userData.id !== user.id) {
		error(400, 'Tried to update a different user');
	}

	const updatedUserData = await DBupdateUser(userData);
	debug('POST -> %o', updatedUserData);
	return json(updatedUserData);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	debug('GET <- %o', user);
	if (!user) {
		error(401, 'Unauthorized');
	}

	debug('user: ', user);
	let userData = await DBgetUser(user.id);
	debug('GET from DB: %o', userData);
	// If there is no user in the database, but the user is logged in, create a new user!
	if (!userData) {
		userData = await DBupdateUser({
			id: user.id,
			email: user.email,
			name: user.user_metadata.name,
			avatar: user.user_metadata.avatar_url
		});
	}

	if (user.user_metadata.avatar_url) userData.avatar = user.user_metadata.avatar_url;

	debug('GET -> %o', userData);
	return json(userData);
};
