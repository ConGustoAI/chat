import { DBdeleteProvider, DBgetProvider, DBupsertProvider } from '$lib/db/utils/providers';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:provider:id');

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	debug('POST %o', id);
	if (!user) {
		error(401, 'Unauthorized');
	}

	const provider = await request.json();
	debug('POST %o <- %o', id, provider);

	if (provider.id && provider.id !== id) {
		error(400, 'Provider ID in URL does not match assistant ID in body');
	}

	const updatedAssistant = await DBupsertProvider(provider, user.id);
	debug('POST %o -> %o', id, updatedAssistant);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	debug('GET %o', id);
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Provider ID is required');
	}

	const assistant = await DBgetProvider(id, user.id);
	debug('GET %o -> %o', id, assistant);
	return json(assistant);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	debug('DELETE %o', id);
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(400, 'Provider ID is required');
	}

	await DBdeleteProvider(id, user.id);
	debug('DELETE %o -> %o', id, { id });
	return json({ id });
};
