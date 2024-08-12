import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import dbg from 'debug';

const debug = dbg('app:login:code');

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	debug('GET <- code: %s', code);

	if (code) {
		const { error: err } = await supabase.auth.exchangeCodeForSession(code);
		if (err) {
			debug('Error exchanging code for session: %o', err);
			throw error(400, 'Error exchanging code for session');
		}
		debug('Successfully exchanged code for session');
	}

	debug('Redirecting to /');
	throw redirect(303, '/');
};
