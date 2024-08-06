import { error, json, type RequestHandler } from '@sveltejs/kit';

import { S_deleteProvider, S_getProvider, S_upsertsProvider } from '$lib/api-server';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const provider = await request.json();

	if (provider.id && provider.id !== id) {
		return error(400, 'Provider ID in URL does not match assistant ID in body');
	}

	const updatedAssistant = await S_upsertsProvider(provider, user.id);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Provider ID is required');
	}

	const assistant = await S_getProvider(id, user.id);
	return json(assistant);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Provider ID is required');
	}

	await S_deleteProvider(id, user.id);
	return json({ id });
};
