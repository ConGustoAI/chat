import { modelsTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:model');

export async function APIfetchModels() {
	debug('fetchModels');
	const res = await fetch('/api/model');

	if (!res.ok) throw new Error(`Failed to fetch models: ${(await res.json()).message}`);
	const data = (await res.json()).map((model: ModelInterface) => filterNull(model));
	debug('fetchModels -> %o', data);
	return data as ModelInterface[];
}

export async function APIfetchModel(id: string) {
	debug('fetchModel %o', id);
	const res = await fetch(`/api/model/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch model: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('fetchModel -> %o', data);
	return data as ModelInterface;
}

export async function APIupsertModel(model: ModelInterface) {
	debug('upsertModel %o', model);
	const res = await fetch('/api/model', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(modelInterfaceFilter(model))
	});

	if (!res.ok) throw new Error(`Failed to update model: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertModel -> %o', data);
	return data as ModelInterface;
}

export async function APIdeleteModel(model: ModelInterface) {
	debug('deleteModel %o', model);
	const res = await fetch(`/api/model`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(model)
	});

	if (!res.ok) throw new Error(`Failed to delete model: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('deleteModel -> %o', data);
	return data as ModelInterface;
}

export function modelInterfaceFilter(model: ModelInterface) {
	const allowedKeys = Object.keys(modelsTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredModel = Object.fromEntries(
		Object.entries(model).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredModel as ModelInterface;
}
