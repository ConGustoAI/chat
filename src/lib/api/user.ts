export async function fetchUser() {
	const res = await fetch('/api/user');
	if (!res.ok) throw new Error('Failed to fetch User');
	return (await res.json()) as UserInterface;
}

export async function updateUser(user: UserInterface) {
	const res = await fetch('/api/user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(user)
	});

	if (!res.ok) throw new Error('Failed to update User: ' + (await res.json()).message);
	return (await res.json()) as UserInterface;
}

export async function deleteUser() {
	const res = await fetch('/api/user', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error('Failed to delete User: ' + (await res.json()).message);
	return await res.json();
}
