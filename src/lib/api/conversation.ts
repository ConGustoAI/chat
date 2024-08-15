import dbg from 'debug';

const debug = dbg('app:lib:api:conversation');

// We seed in some default conversations to show a new user some examples of what they can do.
export async function APIfetchDefaultConversations() {
	debug('fetchDefaultConversations');

	const res = await fetch('/api/conversation/?default=true');

	if (!res.ok) throw new Error(`Failed to fetch default conversations: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface[];
	debug('fetchDefaultConversations -> %o', data);
	return data;
}

export async function APIfetchDefaultConversation(id?: string) {
	debug('fetchDefaultConversation %o', { id });

	if (!id) return { userID: '' } as ConversationInterface;
	const res = await fetch(`/api/conversation/${id}?default=true`);

	if (!res.ok) throw new Error(`Failed to fetch default conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	if (!data.id) throw new Error('The conversation ID is missing in returned data.');
	debug('fetchDefaultConversation -> %o', data);
	return data;
}

export async function APIfetchConversations() {
	debug('fetchConversations %o');

	const res = await fetch('/api/conversation');

	if (!res.ok) throw new Error(`Failed to fetch conversations: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface[];
	debug('fetchConversations -> %o', data);
	return data;
}

export async function APIfetchConversation(id: string | undefined) {
	debug('fetchConversation %o', { id });

	if (!id) return { userID: '' } as ConversationInterface;

	const res = await fetch(`/api/conversation/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	if (!data.id) throw new Error('The conversation ID is missing in returned data.');
	debug('fetchConversation -> %o', data);
	return data;
}

export async function APIupsertConversation(conversation: ConversationInterface) {
	debug('upsertConversation %o', conversation);
	const res = await fetch('/api/conversation', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(conversation)
	});

	if (!res.ok) throw new Error(`Failed to update conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	debug('upsertConversation -> %o', data);
	return data;
}

export async function APIdeleteConversation(conversation: ConversationInterface) {
	debug('deleteConversation %o', conversation);
	const res = await fetch(`/api/conversation`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(conversation)
	});

	if (!res.ok) throw new Error(`Failed to delete conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	debug('deleteConversation -> %o', data);
	return data;
}
