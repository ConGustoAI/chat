import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { info } from 'console';
import { DBgetUser, DBupdateUser } from '$lib/db/utils/users';

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const userData = await request.json();

	if (!userData.id) {
		return error(400, 'ID should not set');
	}

	if (userData.id !== user.id) {
		return error(400, 'Tried to update a different user');
	}

	const updatedUserDAta = await DBupdateUser(userData);
	return json(updatedUserDAta);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const userData = await DBgetUser(user.id);
	info('GET /api/user', userData);
	return json(userData);
};
