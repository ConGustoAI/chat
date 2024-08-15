import { DBgetConversation, DBgetDefaultConversation } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:conversation:id');

export const GET: RequestHandler = async ({ locals: { dbUser }, params: { id }, url }) => {
	const defaults = url.searchParams.get('default') === 'true';

	debug('GET <- %o', { id, defaults });

	let conversation;
	if (defaults) {
		conversation = await DBgetDefaultConversation({ id });
	} else {
		conversation = await DBgetConversation({ dbUser, id });
	}
	debug('GET %o -> %o', id, conversation);
	return json(conversation);
};
