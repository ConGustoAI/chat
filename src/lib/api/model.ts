import dbg from 'debug';

const debug = dbg('app:lib:api:model');

export async function APIfetchModels() {
	debug('fetchModels');
	const res = await fetch('/api/model');

	if (!res.ok) throw new Error(`Failed to fetch models: ${await res.text()}`);
	const data = (await res.json()) as ModelInterface[];
	debug('fetchModels -> %o', data);
	return data;
}

export async function APIfetchModel(id: string) {
	debug('fetchModel %o', id);
	const res = await fetch(`/api/model/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch model: ${await res.text()}`);
	const data = (await res.json()) as ModelInterface;
	debug('fetchModel -> %o', data);
	return data;
}

export async function APIupsertModel(model: ModelInterface) {
	debug('upsertModel %o', model);
	const res = await fetch('/api/model', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(model)
	});

	if (!res.ok) throw new Error(`Failed to update model: ${await res.text()}`);
	const data = (await res.json()) as ModelInterface;
	debug('upsertModel -> %o', data);
	return data;
}

export async function APIdeleteModel(model: ModelInterface) {
	debug('deleteModel %o', model);
	const res = await fetch(`/api/model`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(model)
	});

	if (!res.ok) throw new Error(`Failed to delete model: ${await res.text()}`);
	const data = (await res.json()) as ModelInterface;
	debug('deleteModel -> %o', data);
	return data;
}
