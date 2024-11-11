import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import { Google } from 'arctic';

import { db } from '$lib/db';
import { usersTable } from '$lib/db/schema';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/utils/auth';
import { assert } from '$lib/utils/utils';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

import dbg from 'debug';
const debug = dbg('app:login:google');

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state') ?? null;
	const storedCodeVerifier = cookies.get('google_oauth_code_verifier') ?? null;

	debug('GET <- code: %s, state: %s, storedState: %s, storedVerifier', code, state, storedState, storedCodeVerifier);

	if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
		error(400, 'Invalid state or code or verifier');
	}

	const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, url.origin + '/login/google');

	let tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
	} catch (e) {
		debug('Error validating code', e);
		error(400, 'Error validating code');
	}

	assert(tokens.tokenType().toLowerCase() === 'bearer', 'Expected Bearer token type');

	debug('tokens', tokens);
	const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`
		}
	});
	const googleUser: GoogleUser = await res.json();

	if (!googleUser.email) error(400, 'No email provided by Google');
	if (!googleUser.email_verified) error(400, 'Email not verified');

	const existingUser = await db.query.usersTable.findFirst({
		where: (table, { eq }) => eq(table.email, googleUser.email)
	});

	if (existingUser) {
		const update = await db
			.update(usersTable)
			.set({
				google_id: googleUser.sub.toString(),
				avatar: googleUser.picture
			})
			.where(eq(usersTable.email, googleUser.email))
			.returning();

		if (!update) error(500, 'Failed to update user');

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(cookies, sessionToken, session.expiresAt);
	} else {
		const userId = randomUUID();

		const insert = await db.insert(usersTable).values({
			id: userId,
			google_id: googleUser.sub.toString(),
			name: googleUser.name ?? '',
			email: googleUser.email,
			avatar: googleUser.picture
		});
		if (!insert) error(500, 'Failed to create user');

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, userId);
		setSessionTokenCookie(cookies, sessionToken, session.expiresAt);
	}
	redirect(303, '/chat');
};

interface GoogleUser {
	sub: number;
	name: string;
	picture: string;
	email: string;
	email_verified: boolean;
}
