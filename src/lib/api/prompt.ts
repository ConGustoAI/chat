import { promptsTable } from '$lib/db/schema';
import { filterNull } from '$lib/utils/utils';
import dbg from 'debug';

const debug = dbg('app:lib:api:prompt');

export async function APIupsertPrompt(prompt: PromptInterface) {
	debug('upsertPrompt %o', prompt);
	const res = await fetch('/api/prompt', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(promptInterfaceFilter(prompt))
	});

	if (!res.ok) throw new Error(`Failed to update prompt: ${(await res.json()).message}`);
	const data = filterNull(await res.json());
	debug('upsertPrompt -> %o', data);
	return data as PromptInterface;
}

export function promptInterfaceFilter(prompt: PromptInterface) {
	const allowedKeys = Object.keys(promptsTable);

	const excludedKeys = ['updatedAt', 'createdAt'];

	const filteredPrompt = Object.fromEntries(
		Object.entries(prompt).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
	);

	return filteredPrompt as PromptInterface;
}
