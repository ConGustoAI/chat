import {
	DBdeleteConversations,
	DBgetConversations,
	DBgetDefaultConversations,
	DBupsertConversation
} from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:conversation');

export const GET: RequestHandler = async ({ locals: { session } }) => {
	debug('GET <- ', { user: session ? session.userID : 'anon' });
	let conversations;
	if (!session) {
		conversations = await DBgetDefaultConversations();
	} else {
		conversations = await DBgetConversations({ session });
	}
	debug('GET -> %o', conversations);

	return json(conversations);
};

export const POST: RequestHandler = async ({ request, locals: { session } }) => {
	const conversation = (await request.json()) as ConversationInterface;

	debug('POST <- %o', conversation);
	const updated = await DBupsertConversation({ session, conversation });
	debug('POST -> %o', updated);

	return json(updated);
};

export const DELETE: RequestHandler = async ({ request, locals: { session } }) => {
	const ids = (await request.json()) as string[];

	debug('DELETE <- %o', ids);
	const del = await DBdeleteConversations({ session, ids });
	debug('DELETE -> %o', del);

	return json(del);
};
