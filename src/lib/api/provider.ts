import { providersTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:provider');

export async function APIfetchProviders() {
	debug('fetchProviders');

	const res = await fetch('/api/provider');

	if (!res.ok) throw new Error(`Failed to fetch providers: ${await res.text()}`);
	const data = (await res.json()).map((provider: ProviderInterface) => filterNull(provider));
	debug('fetchProviders -> %o', data);
	return data as ProviderInterface[];
}

export async function APIupsertProvider(provider: ProviderInterface) {
	debug('upsertProvider %o', provider);
	const res = await fetch('/api/provider', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(providerInterfaceFilter(provider))
	});

	if (!res.ok) throw new Error(`Failed to update provider: ${await res.text()}`);
	const data = filterNull(await res.json());
	debug('upsertProvider -> %o', data);
	return data as ProviderInterface;
}

export async function APIdeleteProvider(provider: ProviderInterface) {
	debug('deleteProvider %o', provider);
	const res = await fetch(`/api/provider`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(provider)
	});

	if (!res.ok) throw new Error(`Failed to delete provider: ${await res.text()}`);
	const data = filterNull(await res.json());
	debug('deleteProvider -> %o', data);
	return data as ProviderInterface;
}

export function providerInterfaceFilter(provider: ProviderInterface) {
	const allowedKeys = Object.keys(providersTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredProvider = Object.fromEntries(
		Object.entries(provider).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredProvider as ProviderInterface;
}
