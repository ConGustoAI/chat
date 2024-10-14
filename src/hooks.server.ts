import { type Handle } from '@sveltejs/kit';

import dbg from 'debug';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = dbg('app:hooks');

export const sse = false;

import { userInterfaceFilter } from '$lib/api';
import { lucia } from '$lib/db/auth';
import { DBgetUser, DBinsertUser, DBupdateUser } from '$lib/db/utils';
import { filterNull } from '$lib/utils/utils';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	// if (!sessionId) {
	// 	event.locals.user = null;
	// 	event.locals.session = null;
	// 	return resolve(event);
	// }

	const { session, user } = await lucia.validateSession(sessionId ?? '');
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		// sveltekit types deviates from the de-facto standard
		// you can use 'as any' too
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	// event.locals.user = user;
	// event.locals.session = session;

	// debug('session', session);
	// debug('user', user);

	if (user) {
		event.locals.dbUser = filterNull(await DBgetUser({ id: user.id })) as UserInterface | undefined;

		if (!event.locals.dbUser) {
			event.locals.dbUser = (await DBinsertUser({
				user: {
					id: user.id,
					email: user.email,
					name: user.username,
					avatar: user.avatar_url
				}
			})) as UserInterface;
		}

		// The user had no avattar before, but the new log in method was used that provides an avatar
		if (!event.locals.dbUser.avatar && user.avatar_url) {
			await DBupdateUser({
				dbUser: userInterfaceFilter(event.locals.dbUser),
				updatedUser: { ...event.locals.dbUser, avatar: user.avatar_url }
			});

			event.locals.dbUser.avatar = user.avatar_url;
		}
	} else {
		event.locals.dbUser = undefined;
	}

	// debug("dbUser", event.locals.dbUser)

	// debug("hook %o", {session: event.locals.session, user: event.locals.user, dbUser: event.locals.dbUser, assistants: event.locals.assistants, hiddenItems: event.locals.hiddenItems});

	return resolve(event);
};
