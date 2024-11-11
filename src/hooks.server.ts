import { type Handle } from '@sveltejs/kit';

import dbg from 'debug';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = dbg('app:hooks');

export const sse = false;

// import { lucia } from '$lib/db/auth';
import { DBGetPublicConversation } from '$lib/db/utils';
import { getSessionTokenCookie, validateSession } from '$lib/utils/auth';
import { filterNull } from '$lib/utils/utils';

function makeDescription(conversation: ConversationInterface | undefined) {
	if (!conversation?.messages?.length) return '';

	const text = conversation?.messages?.length === 1 ? conversation.messages[0].text : conversation.messages[1].text;
	return (text.length > 80 ? text.slice(0, 77) + '...' : text).split('\n')[0];
}

export const handle: Handle = async ({ event, resolve }) => {
	debug('event path: %o', event.url.pathname);

	let session: SessionInterface | undefined = undefined;

	// For public messages, we want them to look the way they would look to an
	// anonymous user, even if the user is logged in
	if (!event.url.password.startsWith('/public/')) {
		const sessionCookie = getSessionTokenCookie(event);

		if (sessionCookie) {
			session = await validateSession(event, sessionCookie);
		}
	}

	debug('session %o', session);

	event.locals.session = session;

	let meta_tags = '';
	if (event.url.pathname.match(/^\/public\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
		const id = event.url.pathname.split('/')[2];

		const conversation = filterNull(await DBGetPublicConversation({ id })) as ConversationInterface | undefined;
		const description = makeDescription(conversation);
		const summary = conversation?.summary || 'New Chat';
		// debug('public conversation %o', conversation);

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
