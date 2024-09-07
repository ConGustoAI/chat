import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { error, redirect } from '@sveltejs/kit';
import { GitHub } from 'arctic';
import dbg from 'debug';

const debug = dbg('app:login:github');

const github = new GitHub(GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);

// import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/db';
import { lucia } from '$lib/db/auth';
import { authUsersTable } from '$lib/db/schema';
import { randomUUID } from 'crypto';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('github_oauth_state') ?? null;

	debug('GET <- code: %s, state: %s, storedState: %s', code, state, storedState);

	if (!code || !state || !storedState || state !== storedState) {
		error(400, 'Invalid state or code');
	}

	let tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch (e) {
		debug('Error validating code', e);
		error(400, 'Error validating code');
	}
	const githubUserResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken}`
		}
	});
	const githubUser: GitHubUser = await githubUserResponse.json();

	const emailsResponse = await fetch('https://api.github.com/user/public_emails', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken}`
		}
	});
	const emails: Array<{ email: string; primary: boolean; verified: boolean; visibility: 'public' }> =
		await emailsResponse.json();

	debug('githubUser', githubUser);
	debug('emails', emails);

	const primaryEmail = emails.find((email) => email.primary) ?? null;

	if (!primaryEmail) error(400, 'No primary email address');
	if (!primaryEmail?.verified) error(400, 'Primary email address not verified');

	const existingUser = await db.query.authUsersTable.findFirst({
		where: (table, { eq }) => eq(table.github_id, githubUser.id.toString())
	});

	if (existingUser) {
		const update = await db
			.update(authUsersTable)
			.set({
				github_id: githubUser.id.toString(),
				avatar_url: githubUser.avatar_url
			})
			.where(eq(authUsersTable.email, primaryEmail.email))
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
			github_id: githubUser.id.toString(),
			username: githubUser.name ?? githubUser.login,
			email: primaryEmail!.email,
			avatar_url: githubUser.avatar_url
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
};

interface GitHubUser {
	id: number;
	login: string;
	name: string;
	avatar_url: string;
}
