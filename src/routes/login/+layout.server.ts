// import dbg from 'debug';
// import { error, redirect } from '@sveltejs/kit';

// const debug = dbg('app:login:layout.server');


// export async function load({ locals, url }) {


// export async function load({ locals, url }) {
// 	const code = url.searchParams.get('code');
// 	debug('GET <- code: %s', code);
//     debug('url: %o', url);

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
//         // It's either login or login/pwreset
//         if (url.pathname === '/login') redirect(303, '/chat');
// 	}

// }
