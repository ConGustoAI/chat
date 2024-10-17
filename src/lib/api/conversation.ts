import { conversationsTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:conversation');

// This can run on the backend or the frontend, so we pass fetch as an argument.
export async function APIfetchPublicConversation(id: string, fetch: typeof window.fetch = window.fetch) {
	debug('fetchPublicConversation %o', { id });

	const res = await fetch(`/api/public/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch public conversation: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	if (!data.id) throw new Error('The conversation ID is missing in returned data.');
	debug('fetchPublicConversation -> %o', data);
	return data as ConversationInterface;
}

export async function APIfetchConversations() {
	debug('fetchConversations');

	const res = await fetch('/api/conversation');

	if (!res.ok) throw new Error(`Failed to fetch conversations: ${(await res.json()).message}`);
	const data = (await res.json()).map((conversation: ConversationInterface) => filterNull(conversation));
	debug('fetchConversations -> %o', data);
	return data as ConversationInterface[];
}

export async function APIfetchConversation(id: string) {
	debug('fetchConversation %o', { id });

	if (!id) return filterNull({ userID: '' } as ConversationInterface);

	const res = await fetch(`/api/conversation/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch conversation: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	if (!data.id) throw new Error('The conversation ID is missing in returned data.');
	debug('fetchConversation -> %o', data);
	return data as ConversationInterface;
}

export async function APIupsertConversation(conversation: ConversationInterface) {
	debug('upsertConversation %o', conversation);
	const res = await fetch('/api/conversation', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(conversationInterfaceFilter(conversation))
	});

	if (!res.ok) throw new Error(`Failed to update conversation: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertConversation -> %o', data);
	return data as ConversationInterface;
}

export async function APIdeleteConversations(ids: string[]) {
	debug('deleteConversation %o', ids);
	if (ids.length === 0) return;
	const res = await fetch(`/api/conversation`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(ids)
	});

	if (!res.ok) throw new Error(`Failed to delete conversation: ${(await res.json()).message}`);
	const deletedIds = await res.json();
	debug('deleteConversation -> %o', deletedIds);
	return deletedIds as string[];
}

export async function APISearchConversations(search: string) {
	debug('searchConversations %o', { search });
	const res = await fetch('/api/search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ search })
	});

	if (!res.ok) throw new Error(`Failed to search conversations: ${(await res.json()).message}`);
	const data = (await res.json()) as string[];
	debug('searchConversations -> %o', data);
	return data as string[];
}

export function conversationInterfaceFilter(conversation: ConversationInterface) {
	const allowedKeys = Object.keys(conversationsTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredConversation = Object.fromEntries(
		Object.entries(conversation).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredConversation as ConversationInterface;
}
