import type { Provider } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import dbg from 'debug';
import type { Actions } from './$types';

const debug = dbg('app:login');

export const actions: Actions = {
	signup: async ({ request, locals: { supabase }, url }) => {
		debug('signup');
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const ret = await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: url.origin + '/login' }
		});
		debug('signup', ret);
		if (ret.error) {
			return fail(400, { emailError: ret.error.message });
		} else {
			if (ret.data?.session) redirect(303, '/chat');
			else redirect(303, '/login/verify?email=' + encodeURIComponent(email));
		}
	},

	loginEmail: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email) return fail(400, { email, emailMissing: 'Email is required' });
		if (!password) return fail(400, { password, pwmissing: 'Password is required' });

		const authReponse = await locals.supabase.auth.signInWithPassword({ email, password });
		if (authReponse.error) {
			debug(authReponse.error);
			return fail(400, { email, emailError: authReponse.error.message, password: '' });
		} else {
			locals.session = authReponse.data.session;
			locals.user = authReponse.data.user;
			redirect(303, '/chat');
		}
	},

	loginProvider: async ({ locals, url }) => {
		const provider = url.searchParams.get('provider') as Provider;

		if (provider) {
			const { data, error: err } = await locals.supabase.auth.signInWithOAuth({
				provider,
				options: { redirectTo: url.origin + '/login' }
			});
			if (err) {
				debug(err);
				return fail(400, { providerError: err.message });
			} else {
				redirect(303, data.url);
			}
		}
	},

	recover: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		if (!email) return fail(400, { email, emailmissing: true });

		debug('recover', email);
		const res = await supabase.auth.resetPasswordForEmail(email, { redirectTo: url.origin + '/login/pwreset' });
		if (res.error) {
			debug('error', res.error);
			return fail(400, { pwresetError: res.error.message });
		}
		debug('recover', res);
		return { pwresetSent: "Password reset email sent if the user exists" };
	}
};
