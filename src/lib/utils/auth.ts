import { DBDeleteAllSessions, DBDeleteSession, DBGetSession, DBInsertSession, DBUpdateSession } from '$lib/db/utils';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import dbg from 'debug';
import { filterNull } from './utils';
const debug = dbg('app:lib:utils:auth');

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(token: string, userID: string): Promise<SessionInterface> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: SessionInterface = {
		id: sessionId,
		userID,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await DBInsertSession(session);
	return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
	await DBDeleteSession(sessionId);
}

export async function deleteAllSessions(userID: string): Promise<void> {
	await DBDeleteAllSessions(userID);
}


export async function validateSession(event: RequestEvent, token?: string | null): Promise<SessionInterface | undefined> {
	if (!token) return undefined;

	// debug('validateSessionToken %o', token);

	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	// debug('sessionId %o', sessionId);

	const sessionUser = filterNull(await DBGetSession(sessionId, !event.url.pathname.startsWith("/api/"))) as SessionInterface | undefined;
	// debug('sessionUser %o', sessionUser);
	if (!sessionUser) return undefined;

	if (Date.now() >= new Date(sessionUser.expiresAt).getTime()) {
		debug('Session expired %o', sessionUser);
		await DBDeleteSession(sessionUser.id);
		deleteSessionTokenCookie(event.cookies);
		return undefined;
	}
	if (Date.now() >= new Date(sessionUser.expiresAt).getTime() - 1000 * 60 * 60 * 24 * 15) {
		debug('Session expires soon %o', sessionUser);
		sessionUser.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await DBUpdateSession(sessionUser);
		setSessionTokenCookie(event.cookies, token, sessionUser.expiresAt);
	}
	// debug('Session valid %o', sessionUser);
	return sessionUser;
}

export function setSessionTokenCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	debug('setSessionTokenCookie %o', { token, expiresAt });
	cookies.set('congusto_session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: new Date(expiresAt),
		path: '/'
	});
}

export function deleteSessionTokenCookie(cookies: Cookies): void {
	debug('deleteSessionTokenCookie');
	cookies.set('congusto_session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}

export function getSessionTokenCookie(event: RequestEvent): string | undefined {
	return event.cookies.get('congusto_session');
}
