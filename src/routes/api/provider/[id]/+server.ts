import { DBdeleteProvider, DBgetProvider, DBupsertProvider } from '$lib/db/utils/providers';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const provider = await request.json();

	if (provider.id && provider.id !== id) {
		return error(400, 'Provider ID in URL does not match assistant ID in body');
	}

	// console.log('provider', provider);

	const updatedAssistant = await DBupsertProvider(provider, user.id);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Provider ID is required');
	}

	const assistant = await DBgetProvider(id, user.id);
	return json(assistant);
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	if (!id) {
		return error(400, 'Provider ID is required');
	}

	await DBdeleteProvider(id, user.id);
	return json({ id });
};
