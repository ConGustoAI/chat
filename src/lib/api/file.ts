import { fileTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:file');

export async function APIfetchFile(id: string) {
	debug('fetchFile %o', { id });

	const res = await fetch(`/api/file/${id}`);

	if (!res.ok) throw new Error(`Failed to fetch file: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	if (!data.id) throw new Error('The file ID is missing in returned data.');
	debug('fetchFile -> %o', data);
	return data as FileInterface;
}

export async function APIupsertFile(file: FileInterface, uploadUrl: boolean = false) {
	debug('upsertFile %o', file);
	const res = await fetch(`/api/file?uploadurl=${!!uploadUrl}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(FileInterfaceFilter(file))
	});

	if (!res.ok) throw new Error(`Failed to upsert file: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertFile -> %o', data);
	return data as FileInterface;
}

export async function APIdeleteFile(id: string) {
	debug('deleteFile %o', { id });
	const res = await fetch(`/api/file/${id}`, {
		method: 'DELETE'
	});

	if (!res.ok) throw new Error(`Failed to delete file: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('deleteFile -> %o', data);
	return data as FileInterface;
}

export function FileInterfaceFilter(file: FileInterface) {
	const allowedKeys = Object.keys(fileTable);
	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredFile = Object.fromEntries(
		Object.entries(file).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredFile as FileInterface;
}

export async function fetchFileByID(id: string, name: string = 'filename') {
	const url = `/api/bucket/${id}`;
	debug('Fetching file from %o', url);
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const blob = await response.blob();
	return new File([blob], name);
}
