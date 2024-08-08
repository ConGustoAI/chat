export async function fetchAssistants() {
	const res = await fetch('/api/assistant');
	if (!res.ok) throw new Error(`Failed to fetch assistants: ${await res.text()}`);

	return (await res.json()) as AssistantInterface[];
}

export async function fetchAssistant(id: string) {
	const res = await fetch(`/api/assistant/${id}`);
	if (!res.ok) throw new Error(`Failed to fetch assistant: ${await res.text()}`);
	return (await res.json()) as AssistantInterface;
}

export async function upsertAssistant(assistant: AssistantInterface) {
	let res;
	if (assistant.id) {
		res = await fetch(`/api/assistant/${assistant.id}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(assistant)
		});
	} else {
		res = await fetch('/api/assistant', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(assistant)
		});
	}

	if (!res.ok) throw new Error(`Failed to update assistant: ${await res.text()}`);
	return (await res.json()) as AssistantInterface;
}

export async function deleteAssistant(id: string) {
	const res = await fetch(`/api/assistant/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	console.log('deleteAssistant', res);
	if (!res.ok) throw new Error(`Failed to delete assistant: ${await res.text()}`);
	return (await res.json()) as AssistantInterface;
}
