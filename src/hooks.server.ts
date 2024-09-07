import { type Handle } from '@sveltejs/kit';

import dbg from 'debug';
const debug = dbg('app:hooks');

export const sse = false;

import { lucia } from '$lib/db/auth';
import { DBgetAssistants, DBgetHiddenItems, DBgetUser, DBinsertUser, DBupdateUser } from '$lib/db/utils';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await lucia.validateSession(sessionId);
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
	event.locals.user = user;
	event.locals.session = session;

	// debug('session', session);
	// debug('user', user);

	if (user) {
		[event.locals.hiddenItems, event.locals.dbUser, event.locals.assistants] = (await Promise.all([
			DBgetHiddenItems({ dbUser: { id: user.id } }),
			DBgetUser({ id: user.id }),
			DBgetAssistants({ dbUser: { id: user.id } })
		])) as [Set<string>, UserInterface, AssistantInterface[]];

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
			DBupdateUser({
				dbUser: event.locals.dbUser,
				updatedUser: { ...event.locals.dbUser, avatar: user.avatar_url }
			});

			event.locals.dbUser.avatar = user.avatar_url;
		}
	} else {
		event.locals.hiddenItems = new Set();
		event.locals.dbUser = undefined;
		event.locals.assistants = (await DBgetAssistants({})) as AssistantInterface[];
	}

	debug({session: event.locals.session, user: event.locals.user, dbUser: event.locals.dbUser });

	return resolve(event);
};

// export const handle: Handle = async ({ event, resolve }) => {
// 	// debug('start event handler', event);

// 	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
// 		auth: { debug: false },

// 		cookies: {
// 			get: (key) => {
// 				const value = event.cookies.get(key);
// 				// debug('cookies get', { key, value });
// 				return value;
// 			},
// 			set: (key, value, options) => {
// 				// debug('cookies set', { key, value, options });
// 				event.cookies.set(key, value, { ...options, path: options.path ?? '/' });
// 			},
// 			remove: (key, options) => {
// 				// debug('cookies remove', { key, options });
// 				event.cookies.delete(key, { ...options, path: options.path ?? '/' });
// 			}
// 		}
// 	});
// 	// debug('supabase', event.locals.supabase);

// 	event.locals.safeGetSession = async () => {
// 		// Retry logic for getSession
// 		for (let attempt = 0; attempt < 3; attempt++) {
// 			// debug('getSession attempt', attempt);
// 			const sessionResponse = await event.locals.supabase.auth.getSession();
// 			if (sessionResponse.data.session) {
// 				const userResponse = await event.locals.supabase.auth.getUser();
// 				if (!userResponse.error) return { session: sessionResponse.data.session, user: userResponse.data.user };
// 				else debug('Error getting user: ', userResponse.error);
// 			}
// 		}

// 		return { session: null, user: null };
// 	};

// 	const { session, user } = await event.locals.safeGetSession();
// 	event.locals.session = session ?? undefined;
// 	event.locals.user = user ?? undefined;

// 	// debug('session', event.locals.session);
// 	// debug('user', event.locals.user);



// 	return resolve(event, {
// 		filterSerializedResponseHeaders(name) {
// 			/**
// 			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
// 			 * headers, so we need to tell SvelteKit to pass it through.
// 			 */
// 			return name === 'content-range' || name === 'x-supabase-api-version';
// 		}
// 	});
// };
