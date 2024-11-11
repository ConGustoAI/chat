import { DBdeleteAssistant, DBgetAssistants, DBupsertsAssistant } from '$lib/db/utils/assistants';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:assistant');

export const POST: RequestHandler = async ({ request, locals: { session } }) => {
	const assistant = await request.json();
	debug('POST <- %o', assistant);
	const updatedAssistant = await DBupsertsAssistant({ session, assistant });
	debug('POST -> %o', updatedAssistant);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { session } }) => {
	debug('GET');
	const assistants = await DBgetAssistants({ session });
	debug('GET -> %o', assistants);
	return json(assistants);
};

export const DELETE: RequestHandler = async ({ locals: { session }, request }) => {
	const assistant = await request.json();
	debug('DELETE <- %o', assistant);
	const del = await DBdeleteAssistant({ session, assistant });
	debug('DELETE -> %o', del);
	return json(del);
};
