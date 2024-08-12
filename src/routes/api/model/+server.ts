import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetModels, DBupsertModel } from '$lib/db/utils/models';
import dbg from 'debug';

const debug = dbg('app:api:model');

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const model = await request.json();
	debug('POST <- %o', model);

	if (model.id) {
		error(400, 'ID should not be set for a new model');
	}

	const updatedModel = await DBupsertModel(model, user.id);
	debug('POST -> %o', updatedModel);
	return json(updatedModel);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	debug('GET');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const models = await DBgetModels(user.id);
	debug('GET -> %o', models);
	return json(models);
};
