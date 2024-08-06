export async function fetchAssistants() {
	const res = await fetch('/api/assistant');
	if (!res.ok) throw new Error(`Failed to fetch assistants: ${await res.text()}`);

	const assistantsDict: Record<string, AssistantInterface> = {};

	for (const assistant of await res.json()) {
		assistantsDict[assistant.id] = assistant;
	}
	return assistantsDict;
}

export async function fetchHistory() {
	const res = await fetch('/api/history');
	if (!res.ok) throw new Error('Failed to fetch conversations');
	const data = await res.json();

	const historyDict: Record<string, ConversationInterface> = {};

	for (const conversation of data) {
		historyDict[conversation.id] = conversation;
	}
	return historyDict;
}

export async function fetchConversation(id: string) {
	const res = await fetch(`/api/conversation/${id}`);
	if (!res.ok) throw new Error('Failed to fetch conversation');

	return await res.json();
}

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

export async function fetchProviders(keys?: boolean, models?: boolean) {
	const queryParams = new URLSearchParams();
	if (keys) queryParams.append('keys', 'true');
	if (models) queryParams.append('models', 'true');
	const res = await fetch(`/api/provider?${queryParams}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
		// body: JSON.stringify(options)
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
