import { error, redirect } from '@sveltejs/kit';
import dbg from 'debug';
import type { Actions } from './$types';

const debug = dbg('app:login:pwreset');

export const load = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	debug('load <- code: %s', code);

	if (code) {
		const authResponse = await locals.supabase.auth.exchangeCodeForSession(code);
		if (authResponse.error) {
			debug('Error exchanging code for session: %o', authResponse.error);
			throw error(400, 'Error exchanging code for session');
		} else {
			debug('Successfully exchanged code for session %o', authResponse.data);
		}
	}
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (password !== confirmPassword) {
			return { error: 'Passwords do not match' };
		}

		const res = await supabase.auth.updateUser({ password });
		if (res.error) {
			debug('Error updating password: %o', res.error);
			return { error: res.error.message };
		}

		debug('Password updated successfully');
		redirect(303, '/chat');
		return { success: true };
	}
};
