import { error, json, type RequestHandler } from '@sveltejs/kit';

import { S_getAssistant, S_upsertsAssistant } from '$lib/api-server';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const assistant = await request.json();

	if (assistant.id && assistant.id !== id) {
		return error(400, 'Assistant ID in URL does not match assistant ID in body');
	}

	const updatedAssistant = S_upsertsAssistant(assistant, user.id);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Assistant ID is required');
	}

	const assistant = S_getAssistant(id, user.id);
	return json(assistant);
};
