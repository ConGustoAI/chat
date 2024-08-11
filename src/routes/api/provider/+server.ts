import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetProviders, DBupsertProvider } from '$lib/db/utils/providers';
import dbg from 'debug';

const debug = dbg('app:api:provider');

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	debug('POST');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const provider = await request.json();
	debug('POST <- ', provider);

	if (provider.id) {
		error(400, 'Provider ID should not be set for a new provider');
	}

	const updatedProvider = await DBupsertProvider(provider, user.id);
	debug('POST -> ', updatedProvider);
	return json(updatedProvider);
};

export const GET: RequestHandler = async ({ url, locals: { user } }) => {
	debug('GET');

	if (!user) {
		error(401, 'Unauthorized');
	}

	const withKeys = url.searchParams.has('keys');
	const withModels = url.searchParams.has('models');

	const providers = await DBgetProviders(user.id, withKeys, withModels);
	debug('GET -> ', providers);
	return json(providers);
};
