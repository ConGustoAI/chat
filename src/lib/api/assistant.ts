import { assistantsTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:assistant');

export async function APIfetchDefaultAssistants() {
	debug('fetchDefaultAssistants');

	const res = await fetch('/api/assistant/?default=true');

	if (!res.ok) throw new Error(`Failed to fetch default assistants: ${(await res.json()).message}`);
	const data = (await res.json()).map((assistant: AssistantInterface) => filterNull(assistant));
	debug('fetchDefaultAssistants -> %o', data);
	return data as AssistantInterface[];
}

export async function APIfetchDefaultAssistant(id?: string) {
	debug('fetchDefaultAssistant %o', { id });

	if (!id) return filterNull({ userID: '' } as AssistantInterface);
	const res = await fetch(`/api/assistant/${id}?default=true`);

	if (!res.ok) throw new Error(`Failed to fetch default assistant: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	if (!data.id) throw new Error('The assistant ID is missing in returned data.');
	debug('fetchDefaultAssistant -> %o', data);
	return data as AssistantInterface;
}

export async function APIfetchAssistants() {
	debug('fetchAssistants');
	const res = await fetch('/api/assistant');

	if (!res.ok) throw new Error(`Failed to fetch assistants: ${(await res.json()).message}`);
	const data = (await res.json()).map((assistant: AssistantInterface) => filterNull(assistant));
	debug('fetchAssistants -> %o', data);
	return data as AssistantInterface[];
}

export async function APIfetchAssistant(id: string) {
	debug('fetchAssistant %o', id);
	const res = await fetch(`/api/assistant/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch assistant: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('fetchAssistant -> %o', data);
	return data as AssistantInterface;
}

export async function APIupsertAssistant(assistant: AssistantInterface) {
	debug('upsertAssistant %o', assistant);
	const res = await fetch('/api/assistant', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(assistantInterfaceFilter(assistant))
	});

	if (!res.ok) throw new Error(`Failed to update assistant: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertAssistant -> %o', data);
	return data as AssistantInterface;
}

export async function APIdeleteAssistant(assistant: AssistantInterface) {
	debug('deleteAssistant %o', assistant);
	const res = await fetch('/api/assistant', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(assistant)
	});

	if (!res.ok) throw new Error(`Failed to delete assistant: ${(await res.json()).message}`);
	const del = filterNull(await res.json());
	debug('deleteAssistant -> %o', del);
	return del as AssistantInterface;
}

export function assistantInterfaceFilter(assistant: AssistantInterface) {
	const allowedKeys = Object.keys(assistantsTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredAssistant = Object.fromEntries(
		Object.entries(assistant).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredAssistant as AssistantInterface;
}
