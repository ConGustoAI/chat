import { conversationsTable } from '$lib/db/schema';
import dbg from 'debug';

const debug = dbg('app:lib:api:conversation');

// This can run on the backend or the frontend, so we pass fetch as an argument.
export async function APIfetchPublicConversation(id: string, fetch: typeof window.fetch = window.fetch) {
	debug('fetchPublicConversation %o', { id });

	const res = await fetch(`/api/public/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch public conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	if (!data.id) throw new Error('The conversation ID is missing in returned data.');
	debug('fetchPublicConversation -> %o', data);
	return data;
}

export async function APIfetchConversations() {
	debug('fetchConversations');

	const res = await fetch('/api/conversation');

	if (!res.ok) throw new Error(`Failed to fetch conversations: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface[];
	debug('fetchConversations -> %o', data);
	return data;
}

export async function APIfetchConversation(id: string) {
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
		body: JSON.stringify(conversationInterfaceFilter(conversation))
	});

	if (!res.ok) throw new Error(`Failed to update conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	debug('upsertConversation -> %o', data);
	return data;
}

export async function APIdeleteConversations(ids: string[]) {
	debug('deleteConversation %o', ids);
	const res = await fetch(`/api/conversation`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(ids)
	});

	if (!res.ok) throw new Error(`Failed to delete conversation: ${await res.text()}`);
	const data = (await res.json()) as ConversationInterface;
	debug('deleteConversation -> %o', data);
	return data;
}

export async function APISearchConversations(search: string) {
	debug('searchConversations %o', { search });
	const res = await fetch('/api/search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ search })
	});

	if (!res.ok) throw new Error(`Failed to search conversations: ${await res.text()}`);
	const data = await res.json() as string[];
	debug('searchConversations -> %o', data);
	return data;
}


export function conversationInterfaceFilter(conversation: ConversationInterface) {
	const allowedKeys = Object.keys(conversationsTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredConversation = Object.fromEntries(
		Object.entries(conversation).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredConversation as ConversationInterface;
}
