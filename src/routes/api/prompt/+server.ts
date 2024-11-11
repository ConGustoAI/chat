import { DBinsertPrompt } from '$lib/db/utils/prompts';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:prompt');

export const POST: RequestHandler = async ({ locals: { session }, request }) => {
	const prompt = await request.json() as PromptInterface

	debug('POST <- %o', prompt);
	const inserted = await DBinsertPrompt({ session, prompt });
	debug('POST -> %o', inserted);

	return json(inserted);
};
