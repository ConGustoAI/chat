import { DBgetAssistant } from '$lib/db/utils/assistants';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('/app:api:assistant:id');

export const GET: RequestHandler = async ({ locals: { dbUser }, params: { id } }) => {
	debug('GET <- %o', id);
	const assistant = await DBgetAssistant({ dbUser, id });
	debug('GET %o -> %o', id, assistant);
	return json(assistant);
};
