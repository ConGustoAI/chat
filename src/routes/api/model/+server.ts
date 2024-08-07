import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { info } from 'console';
import { DBgetModels, DBupsertModel } from '$lib/db/utils/models';

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) {
		return error(401, 'Unauthorized');
	}

	const model = await request.json();

	if (model.id) {
		return error(400, 'ID should not be set for a new model');
	}

	const updatedAssistant = await DBupsertModel(model, user.id);
	return json(updatedAssistant);
};

export const GET: RequestHandler = async ({ locals: { user } }) => {
	info('GET /api/model');
	if (!user) {
		error(401, 'Unauthorized');
	}

	const models = await DBgetModels(user.id);
	info('GET /api/models', models);
	return json(models);
};
