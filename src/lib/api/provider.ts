import dbg from 'debug';

const debug = dbg('app:lib:api:provider');

export async function APIfetchProviders() {
	debug('fetchProviders');

	const res = await fetch('/api/provider');

	if (!res.ok) throw new Error(`Failed to fetch providers: ${await res.text()}`);
	const data = (await res.json()) as ProviderInterface[];
	debug('fetchProviders -> %o', data);
	return data;
}

export async function APIupsertProvider(provider: ProviderInterface) {
	debug('upsertProvider %o', provider);
	const res = await fetch('/api/provider', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(provider)
	});

	if (!res.ok) throw new Error(`Failed to update provider: ${await res.text()}`);
	const data = (await res.json()) as ProviderInterface;
	debug('upsertProvider -> %o', data);
	return data;
}

export async function APIdeleteProvider(provider: ProviderInterface) {
	debug('deleteProvider %o', provider);
	const res = await fetch(`/api/provider`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(provider)
	});

	if (!res.ok) throw new Error(`Failed to delete provider: ${await res.text()}`);
	const data = (await res.json()) as ProviderInterface;
	debug('deleteProvider -> %o', data);
	return data;
}
