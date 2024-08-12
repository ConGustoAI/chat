import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBgetMessage, DBupsertMessage, DBdeleteMessage } from '$lib/db/utils';
import dbg from 'debug';
const debug = dbg('app:api:message:id');

export const GET: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	debug('GET <- %o', id);
	try {
		const message = await DBgetMessage(id, user.id);
		debug('GET %o -> %o', id, message);
		return json(message);
	} catch (err) {
		if (err instanceof Error) {
			error(500, 'Failed to fetch message: ' + err.message);
		}
		error(500, 'Failed to fetch message');
	}
};

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}
	const message = await request.json();
	debug('POST %o <- %o', id, message);

	if (!id) {
		error(405, 'Message ID is required');
	}

	if (message.id && message.id !== id) {
		error(400, 'Message ID in URL does not match message ID in body');
	}

	try {
		const updated = await DBupsertMessage(message, user.id);
		debug('POST %o -> %o', id, updated);
		return json(updated);
	} catch (err) {
		if (err instanceof Error) {
			error(500, 'Failed to update message: ' + err.message);
		}
		error(500, 'Failed to update message');
	}
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	debug('DELETE %o', id);
	try {
		await DBdeleteMessage(id, user.id);
		return json({ message: 'Message deleted' });
	} catch (err) {
		if (err instanceof Error) {
			error(500, 'Failed to delete message: ' + err.message);
		}
		error(500, 'Failed to delete message');
	}
};
