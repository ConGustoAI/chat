export async function fetchConversations(withMessages = false) {
	const queryParams = new URLSearchParams();
	if (withMessages) queryParams.append('messages', 'true');
	const res = await fetch('/api/conversation?' + queryParams);
	if (!res.ok) throw new Error('Failed to fetch conversations: ' + (await res.json()).message);
	const data = await res.json();

	return data as ConversationInterface[];
}

export async function fetchConversation(id: string, withMessages = false, withDeleted = false) {
	const queryParams = new URLSearchParams();
	if (withMessages) queryParams.append('messages', 'true');
	if (withMessages && withDeleted) queryParams.append('deleted', 'true');
	const res = await fetch(`/api/conversation/${id}?${queryParams}`);
	if (!res.ok) throw new Error('Failed to fetch conversation: ' + (await res.json()).message);

	const data = await res.json();
	if (!data.id) throw new Error('The conversation ID is missing.');
	return data as ConversationInterface;
}

export async function upsertConversation(conversation: ConversationInterface) {
	const res = await fetch(`/api/conversation` + conversation.id ? '/' + conversation.id : '', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(conversation)
	});

	if (!res.ok) throw new Error('Failed to update conversation: ' + (await res.json()).message);
	return (await res.json()) as ConversationInterface;
}

export async function deleteConversation(id: string) {
	const res = await fetch(`/api/conversation/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete conversation: ' + (await res.json()).message);
	return (await res.json()) as ConversationInterface;
}
