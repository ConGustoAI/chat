// import type { Provider } from '@supabase/supabase-js';
import { dev } from '$app/environment';
import { fail, redirect } from '@sveltejs/kit';
import { generateCodeVerifier, generateState, Google } from 'arctic';
import dbg from 'debug';
import type { Actions } from './$types';


import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { GitHub } from 'arctic';


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

	github: async ({ cookies, url }) => {
		const state = generateState();
		const redirectURI = url.origin + '/login/github';
		debug('github', state, redirectURI);
		const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, {redirectURI: url.origin + '/login/github'});
		const githubURL = await github.createAuthorizationURL(state);

		cookies.set('github_oauth_state', state, {
			path: '/',
			secure: !dev,
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		redirect(303, githubURL);
	},

	google: async ({ cookies, url }) => {
		const state = generateState();
		const redirectURI = url.origin + '/login/google';
		debug('google', state, redirectURI);
		const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, url.origin + '/login/google');
		const codeVerifier = generateCodeVerifier();

		const googleURL = await google.createAuthorizationURL(state, codeVerifier, {scopes: ['email', 'profile']});

		cookies.set('google_oauth_state', state, {
			path: '/',
			secure: !dev,
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		cookies.set('github_oauth_code_verifier', codeVerifier, {
			secure: !dev, // set to false in localhost
			path: "/",
			httpOnly: true,
			maxAge: 60 * 10, // 10 min
			sameSite: 'lax'
		});

		redirect(303, googleURL);
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
		return { pwresetSent: 'Password reset email sent if the user exists' };
	}
};
