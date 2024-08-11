import { DBgetConversations, DBupsertConversation } from '$lib/db/utils';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import dbg from 'debug';

const debug = dbg('app:api:conversation');

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user } = locals;

	if (!user) {
		error(401, 'Unauthorized');
	}
	const withDeleted = url.searchParams.get('deleted') === 'true';

	debug(`GET <- withDeleted: ${withDeleted}`);
	const conversations = await DBgetConversations(user.id, withDeleted);
	debug('GET -> ', conversations);

	return json(conversations);
};

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const conversation = await request.json();
	if (conversation.id) {
		error(405, 'New conversation should not have an ID');
	}

	conversation.userID = user.id;
	debug('POST <- ', conversation);
	const updated = await DBupsertConversation(conversation, user.id);
	debug('POST -> ', updated);

	return json(updated);
};
