import { DBdeleteAssistant, DBgetAssistant, DBupsertsAssistant } from '$lib/db/utils/assistants';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('/api/assistant/[id]');

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const assistant = await request.json();
	debug(`POST ${id} <- `, assistant);

	if (assistant.id && assistant.id !== id) {
		return error(400, 'Assistant ID in URL does not match assistant ID in body');
	}

	const updatedAssistant = await DBupsertsAssistant(assistant, user.id);
	debug(`POST ${id} -> `, updatedAssistant);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Assistant ID is required');
	}

	debug(`GET <- ${id}`);
	const assistant = await DBgetAssistant(id, user.id);
	debug(`GET ${id} -> `, assistant);
	return json(assistant);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	debug(`DELETE ${id}`);
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Assistant ID is required');
	}

	const res = await DBdeleteAssistant(id, user.id);
	debug(`DELETE ${id} -> `, res);
	return json(res);
};
