export async function fetchModels() {
	const res = await fetch('/api/model');
	if (!res.ok) throw new Error('Failed to fetch Models');
	return await res.json();
}

export async function fetchModel(id: string) {
	const res = await fetch(`/api/model/${id}`);
	if (!res.ok) throw new Error('Failed to fetch Model');
	return await res.json();
}

export async function upsertModel(model: ModelInterface) {
	let res;
	if (model.id) {
		res = await fetch('/api/model/' + model.id, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(model)
		});
	} else {
		res = await fetch('/api/model', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(model)
		});
	}

	if (!res.ok) throw new Error('Failed to update Model: ' + (await res.json()).message);
	return await res.json();
}

export async function deleteModel(id: string) {
	const res = await fetch(`/api/model/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete Model' + (await res.json()).message);
	return await res.json();
}
