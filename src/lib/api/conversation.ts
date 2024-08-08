export async function fetchConversations() {
	const res = await fetch('/api/conversation');
	if (!res.ok) throw new Error('Failed to fetch conversations: ' + (await res.json()).message);
	const data = await res.json();

	return data as ConversationInterface[];
}

export async function fetchConversation(id: string, withMessages = false) {
	const queryParams = new URLSearchParams();
	if (withMessages) queryParams.append('messages', 'true');
	const res = await fetch(`/api/conversation/${id}?${queryParams}`);
	if (!res.ok) throw new Error('Failed to fetch conversation: ' + (await res.json()).message);

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

	if (!res.ok) throw new Error('Failed to update conversation: ' + (await res.json()).message);
	return await res.json();
}

export async function deleteConversation(id: string) {
	const res = await fetch(`/api/conversation/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete conversation: ' + (await res.json()).message);
	return await res.json();
}
