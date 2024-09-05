import { DBgetConversation, DBgetDefaultConversation } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:conversation:id');

export const GET: RequestHandler = async ({ locals: { dbUser }, params: { id } }) => {
	debug('GET <- %o', { id, dbUsed: dbUser ? 'yes' : 'no' });

	let conversation;
	if (dbUser) conversation = await DBgetConversation({ dbUser, id });
	else conversation = await DBgetDefaultConversation({ id });

	debug('GET %o -> %o', id, conversation);
	return json(conversation);
};
