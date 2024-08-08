import { DBgetConversations } from '$lib/db/utils';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = locals;

	if (!user) {
		error(401, 'Unauthorized');
	}
	const conversations = await DBgetConversations(user.id);

	console.log('GET /api/conversation/ -> ', conversations);

	return json(conversations);
};
