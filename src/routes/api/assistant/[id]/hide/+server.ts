// import { DBaddHiddenAssistant, DBdeleteHiddenAssistant } from '$lib/db/utils/hide';
// import { error, json, type RequestHandler } from '@sveltejs/kit';
// import dbg from 'debug';

// const debug = dbg('app:api:assistant:id:hide');

// export const POST: RequestHandler = async ({ locals: { user }, params: { id } }) => {
// 	if (!user) {
// 		return error(401, 'Unauthorized');
// 	}

// 	debug('POST %o', id);
// 	if (!id) {
// 		return error(400, 'Assistant ID is required');
// 	}

// 	const result = await DBaddHiddenAssistant(user.id, id);
// 	debug('POST %o -> %o', id, result);
// 	return json(result);
// };

// export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
// 	if (!user) {
// 		return error(401, 'Unauthorized');
// 	}

// 	debug('DELETE %o', id);

// 	if (!id) {
// 		return error(400, 'Assistant ID is required');
// 	}

// 	const result = await DBdeleteHiddenAssistant(user.id, id);
// 	debug('DELETE %o -> %o', id, result);
// 	return json(result);
// };
