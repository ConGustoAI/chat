import { mediaTable } from '$lib/db/schema';
import dbg from 'debug';
import { filterNull } from '$lib/utils/utils';

const debug = dbg('app:lib:api:media');

export async function APIfetchAllMedia() {
	debug("fetchMedia");
	const res = await fetch(`/api/media`);

	if (!res.ok) throw new Error(`Failed to fetch media: ${(await res.json()).message}`);
	const data = (await res.json()).map((media: MediaInterface) => filterNull(media));
	debug("fetchMedia -> %o", data);
	return data as MediaInterface[];
}

export async function APIupsertMedia(media: MediaInterface) {
	debug('upsertMedia %o', media);
	const res = await fetch('/api/media', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(mediaInterfaceFilter(media))
	});

	if (!res.ok) throw new Error(`Failed to upsert media: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertMedia -> %o', data);
	return data as MediaInterface;
}

export async function APIfetchMedia(id: string) {
	debug('fetchMedia %o', id);
	const res = await fetch(`/api/media/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch media by ID: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('fetchMedia -> %o', data);
	return data as MediaInterface;
}

export async function APIdeleteMedia(id: string) {
	debug('deleteMedia %o', id);
	const res = await fetch(`/api/media/${id}`, {
		method: 'DELETE'
	});

	if (!res.ok) throw new Error(`Failed to delete media: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('deleteMedia -> %o', data);
	return data as MediaInterface;
}

export function mediaInterfaceFilter(media: MediaInterface) {
	const allowedKeys = Object.keys(mediaTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredMedia = Object.fromEntries(
		Object.entries(media).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredMedia as MediaInterface;
}
