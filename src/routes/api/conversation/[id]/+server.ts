import { DBgetConversation, DBgetDefaultConversation } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:conversation:id');

export const GET: RequestHandler = async ({ locals: { dbUser }, params: { id }, url }) => {
	const withURLs = url.searchParams.get('url') === 'true';
	debug('GET <- %o', { id, dbUser: dbUser ? dbUser.id : 'anon', withURLs });

	let conversation;
	if (dbUser) conversation = (await DBgetConversation({ dbUser, id })) as ConversationInterface;
	else conversation = (await DBgetDefaultConversation({ id })) as ConversationInterface;

	debug('GET %o -> %o', id, conversation);
	return json(conversation);
};
