import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import { Google } from 'arctic';
import dbg from 'debug';

const debug = dbg('app:login:github');

// import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { lucia } from '$lib/db/auth';
import { randomUUID } from 'crypto';
import { authUsersTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { assert } from '$lib/utils/utils';

// http://localhost:5173/login/google?
// state=N9r2FiFnk9yMUhDEDCHNUs4PjPDxxjgDOh9CfVJ6G2M&
// code=4%2F0AQlEd8z2XHARlVZpna2KhreF542WZT9gKwDpx5vfrvzpTLtppvq-bf3r7e0aP77d6fSyZQ&
// scope=openid&authuser=0&prompt=none

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	// const codeVerifier = url.searchParams.get('google_oauth_state');
	const storedState = cookies.get('google_oauth_state') ?? null;
	const storedCodeVerifier = cookies.get('github_oauth_code_verifier') ?? null;

	debug('GET <- code: %s, state: %s, storedState: %s', code, state, storedState, storedCodeVerifier);

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		error(400, 'Invalid state or code or verifier');
	}

	let tokens;
	try {
		const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, url.origin + '/login/google');
		tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
	} catch (e) {
		debug('Error validating code', e);
		error(400, 'Error validating code');
	}

	debug('tokens', tokens);

	assert(tokens.tokenType().toLowerCase() === 'bearer', 'Expected Bearer token type');

	const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`
		}
	});

	const googleUser: GoogleUserInterface = await res.json();

	// IDK how you can have google id without a verified email, but let's check it anyway
	if (!googleUser.email) error(400, 'No email provided by Google');
	if (!googleUser.email_verified) error(400, 'Email not verified');

	const existingUser = await db.query.authUsersTable.findFirst({
		where: (table, { eq }) => eq(table.email, googleUser.email)
	});

	if (existingUser) {
		const update = await db
			.update(authUsersTable)
			.set({
				google_id: googleUser.sub.toString(),
				avatar_url: googleUser.picture
			})
			.where(eq(authUsersTable.email, googleUser.email))
			.returning();

		if (!update) error(500, 'Failed to update user');

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	} else {
		const userId = randomUUID();

		const insert = await db.insert(authUsersTable).values({
			id: userId,
			google_id: googleUser.sub.toString(),
			username: googleUser.name ?? 'Unknown',
			email: googleUser.email,
			avatar_url: googleUser.picture
		});
		if (!insert) error(500, 'Failed to create user');

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	redirect(303, '/chat');
	// return new Response('OK');
};

interface GoogleUserInterface {
	sub: number;
	name: string;
	picture: string;
	email: string;
	email_verified: boolean;
}
