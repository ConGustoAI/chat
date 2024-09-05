import {
	DBdeleteConversation,
	DBgetConversations,
	DBgetDefaultConversations,
	DBupsertConversation
} from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:conversation');

export const GET: RequestHandler = async ({ locals: { dbUser }}) => {
	let conversations;
	if (!dbUser) {
		conversations = await DBgetDefaultConversations();
	} else {
		conversations = await DBgetConversations({ dbUser });
	}
	debug('GET -> %o', conversations);

	return json(conversations);
};

export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const conversation = (await request.json()) as ConversationInterface;

	debug('POST <- %o', conversation);
	const updated = await DBupsertConversation({ dbUser, conversation });
	debug('POST -> %o', updated);

	return json(updated);
};

export const DELETE: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const conversation = (await request.json()) as ConversationInterface;

	debug('DELETE <- %o', conversation);
	const del = await DBdeleteConversation({ dbUser, conversation });
	debug('DELETE -> %o', del);

	return json(del);
};
