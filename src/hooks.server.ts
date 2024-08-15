// import { createServerClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:hooks:supabase');

export const sse = false;

import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { DBgetAssistants, DBgetDefaultAssistants, DBgetUser } from '$lib/db/utils';

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
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
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
