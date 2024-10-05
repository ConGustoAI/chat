import { DBGetPublicConversation } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:public:id');

export const GET: RequestHandler = async ({ params: { id } }) => {
	debug('GET <- %o', { id });
	const conversation = await DBGetPublicConversation({ id });
	debug('GET %o -> %o', id, conversation);
	return json(conversation);
};
