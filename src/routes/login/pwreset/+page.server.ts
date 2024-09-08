// import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
// import dbg from 'debug';
// const debug = dbg('app:login:pwreset');

export const actions: Actions = {
	// default: async ({ request, locals }) => {
	// 	const formData = await request.formData();
	// 	const password = formData.get('password') as string;
	// 	const confirmPassword = formData.get('confirmPassword') as string;

	// 	if (password !== confirmPassword) {
	// 		return { error: 'Passwords do not match' };
	// 	}

	// 	const res = await locals.supabase.auth.updateUser({ password });
	// 	if (res.error) {
	// 		debug('Error updating password: %o', res.error);
	// 		return { error: res.error.message };
	// 	}

	// 	debug('Password updated successfully');
	// 	const logoutRes = await locals.supabase.auth.signOut();
	// 	if (logoutRes.error) {
	// 		debug('Error signing out: %o', logoutRes.error);
	// 		return { error: logoutRes.error.message };
	// 	}
	// 	locals.user = locals.session = locals.dbUser = undefined;

	// 	redirect(303, '/login');
	// }
};
