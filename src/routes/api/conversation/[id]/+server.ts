import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBdeleteConversation, DBgetConversation, DBupsertConversation } from '$lib/db/utils';

export const GET: RequestHandler = async ({ locals: { user }, params: { id }, url }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const withMessages = url.searchParams.get('messages') === 'true';

	try {
		const conversation = await DBgetConversation(id, user.id, withMessages);
		return json(conversation);
	} catch (err) {
		if (err instanceof Error) {
			error(500, 'Failed to fetch conversation: ' + err.message);
		}
		error(500, 'Failed to fetch conversation');
	}
};

export const POST: RequestHandler = async ({ request, locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	if (!id) {
		error(405, 'Conversation ID is required');
	}

	const provider = await request.json();
	if (provider.id && provider.id !== id) {
		error(400, 'Conversation ID in URL does not match conversation ID in body');
	}

	try {
		const conversation = await DBupsertConversation(provider, user.id);
		return json(conversation);
	} catch (err) {
		if (err instanceof Error) {
			error(500, 'Failed to update conversation: ' + err.message);
		}
		error(500, 'Failed to update conversation');
	}
};

export const DELETE: RequestHandler = async ({ locals: { user }, params: { id } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	try {
		await DBdeleteConversation(id, user.id);
		return json({ message: 'Conversation deleted' });
	} catch (err) {
		if (err instanceof Error) {
			error(500, 'Failed to delete conversation: ' + err.message);
		}
		error(500, 'Failed to delete conversation');
	}
};
