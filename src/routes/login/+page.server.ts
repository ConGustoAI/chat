import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { generateCodeVerifier, generateState, Google } from 'arctic';
import dbg from 'debug';
import type { Actions } from './$types';


import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { GitHub } from 'arctic';


const debug = dbg('app:login');

export const actions: Actions = {
	github: async ({ cookies, url }) => {
		const state = generateState();
		const redirectURI = url.origin + '/login/github';
		debug('github', state, redirectURI);
		const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, url.origin + '/login/github');
		const scopes = ['user:email', 'read:user'];
		const githubURL = github.createAuthorizationURL(state, scopes);

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
		const scopes = ['email'];

		const googleURL = google.createAuthorizationURL(state, codeVerifier, scopes);

		cookies.set('google_oauth_state', state, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		cookies.set('google_oauth_code_verifier', codeVerifier, {
			path: "/",
			httpOnly: true,
			maxAge: 60 * 10, // 10 min
			sameSite: 'lax'
		});

		redirect(303, googleURL);
	},
};
