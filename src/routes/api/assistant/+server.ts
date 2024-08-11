import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetAssistants, DBupsertsAssistant } from '$lib/db/utils/assistants';
import dbg from 'debug';

const debug = dbg('app:api:assistant');

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const assistant = await request.json();
	debug('POST <- ', assistant);

	if (assistant.id) {
		return error(400, 'Assistant ID should not be provided');
	}

	const updatedAssistant = await DBupsertsAssistant(assistant, user.id);
	debug('POST -> ', updatedAssistant);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	debug('GET');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const assistants = await DBgetAssistants(user.id);
	debug('GET -> ', assistants);
	return json(assistants);
};
