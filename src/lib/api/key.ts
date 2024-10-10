import { apiKeysTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:key');

export async function APIfetchKeys() {
	debug('fetchKeys');
	const res = await fetch('/api/key');

	if (!res.ok) throw new Error(`Failed to fetch keys: ${(await res.json()).message}`);
	const data = (await res.json()).map((key: ApiKeyInterface) => filterNull(key));
	debug('fetchKeys -> %o', data);
	return data as ApiKeyInterface[];
}

export async function APIfetchKey(id: string) {
	debug('fetchKey %o', id);
	const res = await fetch(`/api/key/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch key: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('fetchKey -> %o', data);
	return data as ApiKeyInterface;
}

export async function APIupsertKey(key: ApiKeyInterface) {
	debug('upsertKey %o', key);
	const res = await fetch('/api/key', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(apiKeyInterfaceFilter(key))
	});

	if (!res.ok) throw new Error(`Failed to update key: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertKey -> %o', data);
	return data as ApiKeyInterface;
}

export async function APIdeleteKey(key: ApiKeyInterface) {
	debug('deleteKey %o', key);
	const res = await fetch(`/api/key`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(key)
	});

	if (!res.ok) throw new Error(`Failed to delete key: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('deleteKey -> %o', data);
	return data as ApiKeyInterface;
}

export function apiKeyInterfaceFilter(key: ApiKeyInterface) {
	const allowedKeys = Object.keys(apiKeysTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredKey = Object.fromEntries(
		Object.entries(key).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredKey as ApiKeyInterface;
}
