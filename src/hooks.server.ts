import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:hooks:supabase');

export const sse = false;

import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { DBgetAssistants, DBgetUser, DBinsertUser } from '$lib/db/utils';

export const handle: Handle = async ({ event, resolve }) => {
	// debug('start event handler', event);

	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: { debug: false },

		cookies: {
			get: (key) => {
				const value = event.cookies.get(key);
				// debug('cookies get', { key, value });
				return value;
			},
			set: (key, value, options) => {
				// debug('cookies set', { key, value, options });
				event.cookies.set(key, value, { ...options, path: options.path ?? '/' });
			},
			remove: (key, options) => {
				// debug('cookies remove', { key, options });
				event.cookies.delete(key, { ...options, path: options.path ?? '/' });
			}
		}
	});
	// debug('supabase', event.locals.supabase);

	event.locals.safeGetSession = async () => {
		// Retry logic for getSession
		for (let attempt = 0; attempt < 3; attempt++) {
			// debug('getSession attempt', attempt);
			const sessionResponse = await event.locals.supabase.auth.getSession();
			if (sessionResponse.data.session) {
				const userResponse = await event.locals.supabase.auth.getUser();
				if (!userResponse.error) return { session: sessionResponse.data.session, user: userResponse.data.user };
				else debug('Error getting user: ', userResponse.error);
			}
		}

		return { session: null, user: null };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session ?? undefined;
	event.locals.user = user ?? undefined;
	// debug('session', event.locals.session);
	// debug('user', event.locals.user);

	if (user) {
		[event.locals.dbUser, event.locals.assistants] = (await Promise.all([
			DBgetUser({ id: user.id }),
			DBgetAssistants({ dbUser: { id: user.id } })
		])) as [UserInterface, AssistantInterface[]];

		if (!event.locals.dbUser) {
			event.locals.dbUser = (await DBinsertUser({
				user: {
					id: user.id,
					email: user.email,
					name: user.user_metadata.name,
					avatar: user.user_metadata.avatar_url
				}
			})) as UserInterface;
		}

		if (user.user_metadata.avatar_url) event.locals.dbUser.avatar = user.user_metadata.avatar_url;
	} else {
		event.locals.dbUser = undefined;
		event.locals.assistants = (await DBgetAssistants({})) as AssistantInterface[];
	}
	// debug('dbUser', event.locals.dbUser);

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
