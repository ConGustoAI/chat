export async function fetchProviders(keys?: boolean, models?: boolean) {
	const queryParams = new URLSearchParams();
	if (keys) queryParams.append('keys', 'true');
	if (models) queryParams.append('models', 'true');
	const res = await fetch(`/api/provider?${queryParams}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to fetch providers');
	return (await res.json()) as ProviderInterface[];
}

export async function upsertProvider(provider: ProviderInterface) {
	let res;
	if (provider.id) {
		res = await fetch('/api/provider/' + provider.id, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...provider, apiKeys: undefined })
		});
	} else {
		res = await fetch('/api/provider', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(provider)
		});
	}

	if (!res.ok) throw new Error('Failed to update provider: ' + (await res.json()).message);
	return await res.json();
}

export async function deleteProvider(id: string) {
	const res = await fetch(`/api/provider/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete provider' + (await res.json()).message);
	return await res.json();
}
