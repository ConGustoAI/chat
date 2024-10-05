import { usersTable } from '$lib/db/schema';
import dbg from 'debug';

const debug = dbg('app:lib:api:user');

export async function APIfetchUser() {
	debug('fetchUser');
	const res = await fetch('/api/user');

	if (!res.ok) throw new Error(`Failed to fetch user: ${await res.text()}`);
	const data = (await res.json()) as UserInterface;
	debug('fetchUser -> %o', data);
	return data;
}

export async function APIupdateUser(user: UserInterface) {
	debug('updateUser %o', user);
	const res = await fetch('/api/user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userInterfaceFilter(user))
	});

	if (!res.ok) throw new Error(`Failed to update user: ${await res.text()}`);
	const data = (await res.json()) as UserInterface;
	debug('updateUser -> %o', data);
	return data;
}

export async function APIdeleteUser() {
	debug('deleteUser');
	const res = await fetch('/api/user', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error(`Failed to delete user: ${await res.text()}`);
	const data = await res.json();
	debug('deleteUser -> %o', data);
	return data;
}

export function userInterfaceFilter(user: UserInterface) {
	const allowedKeys = Object.keys(usersTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredUser = Object.fromEntries(
		Object.entries(user).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredUser as UserInterface;
}
