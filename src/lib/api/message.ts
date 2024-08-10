
export async function fetchMessage(id: string, withDeleted = false) {
	const queryParams = new URLSearchParams();
	if (withDeleted) queryParams.append('deleted', 'true');

	const res = await fetch(`/api/message/${id}?${queryParams}`);
	if (!res.ok) throw new Error('Failed to fetch message: ' + (await res.json()).message);

	const data = await res.json();
	if (!data.id) throw new Error('The message ID is missing.');
	return data as ConversationInterface;
}

export async function upsertMessage(message: MessageInterface) {
	const res = await fetch(`/api/message${message.id ? '/' + message.id : ''}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(message)
	});

	if (!res.ok) throw new Error('Failed to update message: ' + (await res.json()).message);
	return (await res.json()) as MessageInterface;
}

export async function deleteMessage(id: string) {
	const res = await fetch(`/api/message/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete message: ' + (await res.json()).message);
	return (await res.json()) as MessageInterface;
}