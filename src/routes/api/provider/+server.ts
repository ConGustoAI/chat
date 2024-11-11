import { DBdeleteProvider, DBgetProviders, DBupsertProvider } from '$lib/db/utils/providers';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:provider');

export const POST: RequestHandler = async ({ request, locals: { session } }) => {
	const provider = await request.json();

	debug('POST <- %o', provider);
	const updatedProvider = await DBupsertProvider({ session, provider });
	debug('POST -> %o', updatedProvider);

	return json(updatedProvider);
};

export const GET: RequestHandler = async ({ locals: { session } }) => {
	debug('GET');
	const providers = await DBgetProviders({ session });
	debug('GET -> %o', providers);

	return json(providers);
};

export const DELETE: RequestHandler = async ({ request, locals: { session } }) => {
	const provider = await request.json();

	debug('DELETE <- %o', provider);
	const del = await DBdeleteProvider({ session, provider });
	debug('DELETE -> %o', del);

	return json(del);
};
