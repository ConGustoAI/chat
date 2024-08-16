// import { createServerClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:hooks:supabase');

export const sse = false;

import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { DBgetAssistants, DBgetDefaultAssistants, DBgetUser, DBinsertUser, DBupdateUser } from '$lib/db/utils';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: { debug: true },
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

	event.locals.safeGetSession = async () => {
		let session = null;
		let user = null;
		let error = null;

		// Retry logic for getSession
		for (let attempt = 0; attempt < 3; attempt++) {
			const sessionResponse = await event.locals.supabase.auth.getSession();
			session = sessionResponse.data.session;
			if (session) break;
			await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second before retrying
		}

		if (!session) return { session: null, user: null };

		// Retry logic for getUser
		for (let attempt = 0; attempt < 3; attempt++) {
			const userResponse = await event.locals.supabase.auth.getUser();
			user = userResponse.data.user;
			error = userResponse.error;
			if (!error) break;
			await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second before retrying
		}

		if (error) {
			debug('Error getting user: ', error);
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session ?? undefined;
	event.locals.user = user ?? undefined;

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
		event.locals.assistants = (await DBgetDefaultAssistants()) as AssistantInterface[];
	}

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
