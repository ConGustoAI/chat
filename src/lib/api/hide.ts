import dbg from 'debug';
const debug = dbg('app:lib:api:hide');

export async function APIfetchHidden() {
	debug('fetchHidden');
	const res = await fetch('/api/hidden');

	if (!res.ok) throw new Error(`Failed to fetch hidden items: ${await res.text()}`);
	const data = new Set((await res.json()) as string[])
	debug('fetchHidden -> %o', data);
	return data;
}

export async function APIhideItem(id: string) {
	debug('hideItem %o', id);
	const res = await fetch(`/api/hidden/${id}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!res.ok) throw new Error(`Failed to hide item: ${await res.text()}`);
	const data = (await res.json()) as HiddenItemInterface;
	debug('hideItem -> %o', data);
	return data;
}

export async function APIunhideItem(id: string) {
	debug('unhideItem %o', id);
	const res = await fetch(`/api/hidden/${id}`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
	});

	if (!res.ok) throw new Error(`Failed to unhide item: ${await res.text()}`);
	const data = (await res.json()) as HiddenItemInterface;
	debug('unhideItem -> %o', data);
	return data;
}
