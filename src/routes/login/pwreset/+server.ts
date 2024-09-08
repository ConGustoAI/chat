// import { error, redirect } from '@sveltejs/kit';
// import dbg from 'debug';
// import type { RequestHandler } from './$types';

// const debug = dbg('app:login:code');

// export const GET: RequestHandler = async ({ url, locals }) => {
// 	const code = url.searchParams.get('code');
// 	debug('GET <- code: %s', code);

// 	if (code) {
// 		const authReponse = await locals.supabase.auth.exchangeCodeForSession(code);
// 		if (authReponse.error) {
// 			debug('Error exchanging code for session: %o', authReponse.error);
// 			throw error(400, 'Error exchanging code for session');
// 		} else {
// 			debug('Successfully exchanged code for session %o', authReponse.data);
// 			locals.session = authReponse.data.session;
// 			locals.user = authReponse.data.user;
// 		}
// 		debug('Successfully exchanged code for session');
// 	}

// 	redirect(303, '/chat');
// };
