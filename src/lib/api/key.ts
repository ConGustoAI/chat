export async function fetchKeys() {
	const res = await fetch('/api/key');
	if (!res.ok) throw new Error('Failed to fetch keys');
	return await res.json();
}

export async function fetchKey(id: string) {
	const res = await fetch(`/api/key/${id}`);
	if (!res.ok) throw new Error('Failed to fetch key');
	return await res.json();
}

export async function upsertKey(key: KeyInterface) {
	let res;
	if (key.id) {
		res = await fetch('/api/key/' + key.id, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(key)
		});
	} else {
		res = await fetch('/api/key', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(key)
		});
	}

	if (!res.ok) throw new Error('Failed to update key: ' + (await res.json()).message);
	return await res.json();
}

export async function deleteKey(id: string) {
	const res = await fetch(`/api/key/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete key' + (await res.json()).message);
	return await res.json();
}
