import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S_getProviders, S_upsertsProvider } from '$lib/api-server';
import { info } from 'console';

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const provider = await request.json();

	if (provider.id) {
		return error(400, 'Provider ID should not be set for a new provider');
	}

	const updatedAssistant = await S_upsertsProvider(provider, user.id);
	return json(updatedAssistant);
};

//
export const GET: RequestHandler = async ({ request, url, locals: { user } }) => {
	info('GET /api/provider');

	if (!user) {
		error(401, 'Unauthorized');
	}

	const withKeys = url.searchParams.has('keys');
	const withModels = url.searchParams.has('models');

	console.log('request', request);

	const providers = await S_getProviders(user.id, withKeys, withModels);
	info('GET /api/providers', providers);
	return json(providers);
};
