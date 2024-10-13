import { messagesTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:message');

export async function APIfetchMessage(id: string, withDeleted = false) {
	debug('fetchMessage %o', { id, withDeleted });
	const queryParams = new URLSearchParams();
	if (withDeleted) queryParams.append('deleted', 'true');

	const res = await fetch(`/api/message/${id}?${queryParams}`);

	if (!res.ok) throw new Error(`Failed to fetch message: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	if (!data.id) throw new Error('The message ID is missing in returned data.');
	debug('fetchMessage -> %o', data);
	return data as MessageInterface;
}

export async function APIupsertMessage(message: MessageInterface) {
	debug('upsertMessage %o', message);
	const res = await fetch('/api/message', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(messageInterfaceFilter(message))
	});

	if (!res.ok) throw new Error(`Failed to update message: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertMessage -> %o', data);
	return data as MessageInterface;
}

// Does not actually delete, but rather marks as deleted.
export async function APIdeleteMessages(ids: string[]) {
	debug('deleteMessage %o', ids);
	if (ids.length === 0) return;
	const res = await fetch('/api/message', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(ids)
	});

	if (!res.ok) throw new Error(`Failed to delete messages: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('deleteMessage -> %o', data);
	return data as MessageInterface;
}

export function messageInterfaceFilter(message: MessageInterface) {
	const allowedKeys = Object.keys(messagesTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredMessage = Object.fromEntries(
		Object.entries(message).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredMessage as MessageInterface;
}
