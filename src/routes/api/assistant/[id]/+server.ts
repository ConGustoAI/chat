import { DBdeleteAssistant, DBgetAssistant, DBupsertsAssistant } from '$lib/db/utils/assistants';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const assistant = await request.json();

	if (assistant.id && assistant.id !== id) {
		return error(400, 'Assistant ID in URL does not match assistant ID in body');
	}

	const updatedAssistant = await DBupsertsAssistant(assistant, user.id);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Assistant ID is required');
	}

	const assistant = await DBgetAssistant(id, user.id);
	return json(assistant);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	console.log('DELETE /api/assistant', id);
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Assistant ID is required');
	}

	const res = await DBdeleteAssistant(id, user.id);
	console.log('DELETE /api/assistant Done', res);
	return json(res);
};
