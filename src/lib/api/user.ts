import { usersTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:user');

export async function APIfetchUser() {
	debug('fetchUser');
	const res = await fetch('/api/user');

	if (!res.ok) throw new Error(`Failed to fetch user: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('fetchUser -> %o', data);
	return data as UserInterface;
}

export async function APIupdateUser(user: UserInterface) {
	debug('updateUser %o', user);
	const res = await fetch('/api/user', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userInterfaceFilter(user))
	});

	if (!res.ok) throw new Error(`Failed to update user: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('updateUser -> %o', data);
	return data as UserInterface;
}

export async function APIdeleteUser() {
	debug('deleteUser');
	const res = await fetch('/api/user', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error(`Failed to delete user: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('deleteUser -> %o', data);
	return data as UserInterface;
}

export function userInterfaceFilter(user: UserInterface) {
	const allowedKeys = Object.keys(usersTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredUser = Object.fromEntries(
		Object.entries(user).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredUser as UserInterface;
}
