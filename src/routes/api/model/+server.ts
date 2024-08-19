import { DBdeleteModel, DBgetModels, DBupsertModel } from '$lib/db/utils/models';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:model');

export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const model = await request.json();

	debug('POST <- %o', model);
	const update = await DBupsertModel({ dbUser, model });
	debug('POST -> %o', update);

	return json(update);
};

export const GET: RequestHandler = async ({ locals: { dbUser } }) => {
	debug('GET');
	const models = await DBgetModels({ dbUser });
	debug('GET -> %o', models);

	return json(models);
};

export const DELETE: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const model = (await request.json()) as ModelInterface;

	debug('DELETE %o', model);
	const res = await DBdeleteModel({ dbUser, model });
	debug('DELETE -> %o', res);

	return json(res);
};
