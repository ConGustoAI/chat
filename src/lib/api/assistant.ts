import dbg from 'debug';

const debug = dbg('app:lib:api:assistant');

export async function APIfetchDefaultAssistants() {
	debug('fetchDefaultAssistants');

	const res = await fetch('/api/assistant/?default=true');

	if (!res.ok) throw new Error(`Failed to fetch default assistants: ${await res.text()}`);
	const data = (await res.json()) as AssistantInterface[];
	debug('fetchDefaultAssistants -> %o', data);
	return data;
}

export async function APIfetchDefaultAssistant(id?: string) {
	debug('fetchDefaultAssistant %o', { id });

	if (!id) return { userID: '' } as AssistantInterface;
	const res = await fetch(`/api/assistant/${id}?default=true`);

	if (!res.ok) throw new Error(`Failed to fetch default assistant: ${await res.text()}`);
	const data = (await res.json()) as AssistantInterface;
	if (!data.id) throw new Error('The assistant ID is missing in returned data.');
	debug('fetchDefaultAssistant -> %o', data);
	return data;
}


export async function APIfetchAssistants() {
	debug('fetchAssistants');
	const res = await fetch('/api/assistant');

	if (!res.ok) throw new Error(`Failed to fetch assistants: ${await res.text()}`);
	const data = (await res.json()) as AssistantInterface[];
	debug('fetchAssistants -> %o', data);
	return data;
}

export async function APIfetchAssistant(id: string) {
	debug('fetchAssistant %o', id);
	const res = await fetch(`/api/assistant/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch assistant: ${await res.text()}`);
	const data = (await res.json()) as AssistantInterface;
	debug('fetchAssistant -> %o', data);
	return data;
}

export async function APIupsertAssistant(assistant: AssistantInterface) {
	debug('upsertAssistant %o', assistant);
	const res = await fetch('/api/assistant', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(assistant)
	});

	if (!res.ok) throw new Error(`Failed to update assistant: ${await res.text()}`);
	const data = (await res.json()) as AssistantInterface;
	debug('upsertAssistant -> %o', data);
	return data;
}

export async function APIdeleteAssistant(assistant: AssistantInterface) {
	debug('deleteAssistant %o', assistant);
	const res = await fetch('/api/assistant', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(assistant)
	});

	if (!res.ok) throw new Error(`Failed to delete assistant: ${await res.text()}`);
	const del = (await res.json()) as AssistantInterface;
	debug('deleteAssistant -> %o', del);
	return del;
}
