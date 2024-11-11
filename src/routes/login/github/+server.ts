import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import { GitHub } from 'arctic';

import { db } from '$lib/db';
import { usersTable } from '$lib/db/schema';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/utils/auth';
import { assert } from '$lib/utils/utils';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

import dbg from 'debug';
const debug = dbg('app:login:github');

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('github_oauth_state') ?? null;

	debug('GET <- code: %s, state: %s, storedState: %s', code, state, storedState);

	if (!code || !state || !storedState || state !== storedState) {
		error(400, 'Invalid state or code');
	}

	const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, url.origin + '/login/github');

	let token;
	try {
		token = await github.validateAuthorizationCode(code);
	} catch (e) {
		debug('Error validating code', e);
		error(400, 'Error validating code');
	}

	assert(token.tokenType() === 'bearer', 'Expected Bearer token type');

	debug('token', token);
	const githubUserResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${token.accessToken()}`
		}
	});
	const githubUser: GitHubUser = await githubUserResponse.json();

	const emailsResponse = await fetch('https://api.github.com/user/public_emails', {
		headers: {
			Authorization: `Bearer ${token.accessToken()}`
		}
	});
	const emails: Array<{ email: string; primary: boolean; verified: boolean; visibility: 'public' }> =
		await emailsResponse.json();

	debug('githubUser', githubUser);
	debug('emails', emails);

	const primaryEmail = emails.find((email) => email.primary) ?? null;

	if (!primaryEmail) error(400, 'No primary email address');
	if (!primaryEmail?.verified) error(400, 'Primary email address not verified');

	const existingUser = await db.query.usersTable.findFirst({
		where: (table, { eq }) => eq(table.email, primaryEmail.email)
	});

	if (existingUser) {
		const update = await db
			.update(usersTable)
			.set({
				github_id: githubUser.id.toString(),
				avatar: githubUser.avatar_url
			})
			.where(eq(usersTable.email, primaryEmail.email))
			.returning();

		if (!update) error(500, 'Failed to update user');

		// This is a new session token.
		// The DB stores the hash of the token to avoid leaking them if the DB is compromised.
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(cookies, sessionToken, session.expiresAt);
	} else {
		const userId = randomUUID();

		const insert = await db.insert(usersTable).values({
			id: userId,
			github_id: githubUser.id.toString(),
			name: githubUser.name ?? githubUser.login,
			email: primaryEmail!.email,
			avatar: githubUser.avatar_url
		});
		if (!insert) error(500, 'Failed to create user');

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, userId);
		setSessionTokenCookie(cookies, sessionToken, session.expiresAt);
	}
	redirect(303, '/chat');
};

interface GitHubUser {
	id: number;
	login: string;
	name: string;
	avatar_url: string;
}
