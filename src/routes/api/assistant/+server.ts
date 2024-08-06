import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S_getAssistants, S_upsertsAssistant } from '$lib/api-server';
import { info } from 'console';

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const assistant = await request.json();

	if (assistant.id) {
		return error(400, 'Assistant ID should not be provided');
	}

	const updatedAssistant = S_upsertsAssistant(assistant, user.id);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	info('GET /api/assistant');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const assistants = await S_getAssistants(user.id);
	info('GET /api/assistant', assistants);
	return json(assistants);
};
