import dbg from 'debug';
import { filterNull } from '$lib/utils/utils';

const debug = dbg('app:lib:api:hide');

export async function APIfetchHidden() {
	debug('fetchHidden');
	const res = await fetch('/api/hidden');

	if (!res.ok) throw new Error(`Failed to fetch hidden items: ${(await res.json()).message}`);
	const data = new Set((await res.json()) as string[]);
	debug('fetchHidden -> %o', data);
	return data;
}

export async function APIhideItem(id: string) {
	debug('hideItem %o', id);
	const res = await fetch(`/api/hidden/${id}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error(`Failed to hide item: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('hideItem -> %o', data);
	return data as HiddenItemInterface;
}

export async function APIunhideItem(id: string) {
	debug('unhideItem %o', id);
	const res = await fetch(`/api/hidden/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!res.ok) throw new Error(`Failed to unhide item: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('unhideItem -> %o', data);
	return data as HiddenItemInterface;
}
