import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DBdeleteConversation, DBgetConversation, DBupsertConversation } from '$lib/db/utils';
import dbg from 'debug';

const debug = dbg('/api/conversation/[id]');

export const GET: RequestHandler = async ({ locals: { user }, params: { id }, url }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const withMessages = url.searchParams.get('messages') === 'true';
	const withDeleted = url.searchParams.get('deleted') === 'true';

	debug(`GET <- ${id}`, { withMessages, withDeleted });

	try {
		const conversation = await DBgetConversation(id, user.id, withMessages, withDeleted);
		debug(`GET ${id} -> `, conversation);
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

	const conversation = (await request.json()) as ConversationInterface;
	debug(`POST ${id} <- `, conversation);

	if (!id) {
		error(405, 'Conversation ID is required');
	}

	if (conversation.id && conversation.id !== id) {
		error(400, 'Conversation ID in URL does not match conversation ID in body');
	}

	try {
		const updated = await DBupsertConversation(conversation, user.id);
		debug(`POST ${id} -> `, updated);
		return json(updated);
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

	debug(`DELETE ${id}`);
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
