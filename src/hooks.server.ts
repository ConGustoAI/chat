import { type Handle } from '@sveltejs/kit';

import dbg from 'debug';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = dbg('app:hooks');

export const sse = false;

import { userInterfaceFilter } from '$lib/api';
import { lucia } from '$lib/db/auth';
import { DBGetPublicConversation, DBgetUser, DBinsertUser, DBupdateUser } from '$lib/db/utils';
import { filterNull } from '$lib/utils/utils';

function makeDescription(conversation: ConversationInterface | undefined) {
	if (!conversation?.messages?.length) return '';

	const text = conversation?.messages?.length === 1 ? conversation.messages[0].text : conversation.messages[1].text;
	return (text.length > 80 ? text.slice(0, 77) + '...' : text).split('\n')[0];
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

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

	event.locals.session = session;
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

	let meta_tags = '';
	if (event.url.pathname.match(/^\/public\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
		const id = event.url.pathname.split('/')[2];

		const conversation = filterNull(await DBGetPublicConversation({ id })) as ConversationInterface | undefined;
		const description = makeDescription(conversation);
		const summary = conversation?.summary || 'New Chat';
		debug('public conversation %o', conversation);

		meta_tags = `
			<meta name="description" content="${summary}">
			<meta name="twitter:title" content="${summary}">
			<meta name="twitter:description" content="${description}">
			<meta property="og:title" content="${summary}">
			<meta property="og:description" content="${description}">
			<meta property="og:url" content="${event.request.url}">
			<meta property="og:type" content="website">
			<meta property="og:site_name" content="👍 Congusto Chat">
		`;
	} else {
		meta_tags = `
			<meta name="description" content="👍 Congusto Chat">
			<meta name="twitter:title" content="👍 Congusto Chat">
			<meta property="og:title" content="👍 Congusto Chat">
			<meta property="og:type" content="website">
			<meta property="og:url" content="${event.request.url}">
		`;
	}
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('%social_meta_tags%', meta_tags);
		}
	});
};
