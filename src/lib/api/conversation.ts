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

export async function upsertConversation(conversation: ConversationInterface) {
	let res;
	if (conversation.id) {
		res = await fetch(`/api/conversation/${conversation.id}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(conversation)
		});
	} else {
		res = await fetch('/api/conversation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(conversation)
		});
	}

	if (!res.ok) throw new Error('Failed to update conversation');
	return await res.json();
}

export async function deleteConversation(id: string) {
	const res = await fetch(`/api/conversation/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete conversation');
	return await res.json();
}
