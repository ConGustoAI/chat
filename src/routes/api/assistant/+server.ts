import { DBdeleteAssistant, DBgetAssistants, DBupsertsAssistant } from '$lib/db/utils/assistants';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:assistant');

export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const assistant = await request.json();
	debug('POST <- %o', assistant);
	const updatedAssistant = await DBupsertsAssistant({ dbUser, assistant });
	debug('POST -> %o', updatedAssistant);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { dbUser } }) => {
	debug('GET');
	const assistants = await DBgetAssistants({ dbUser });
	debug('GET -> %o', assistants);
	return json(assistants);
};

export const DELETE: RequestHandler = async ({ locals: { dbUser }, request }) => {
	const assistant = await request.json();
	debug('DELETE <- %o', assistant);
	const del = await DBdeleteAssistant({ dbUser, assistant });
	debug('DELETE -> %o', del);
	return json(del);
};
