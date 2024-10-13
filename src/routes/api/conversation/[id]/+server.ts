import { DBgetConversation, DBgetDefaultConversation } from '$lib/db/utils';
import { json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';
import { getDownloadURL } from '$lib/utils/files_server';

const debug = dbg('app:api:conversation:id');

export const GET: RequestHandler = async ({ locals: { dbUser }, params: { id }, url }) => {
	const withURLs = url.searchParams.get('url') === 'true';
	debug('GET <- %o', { id, dbUser: dbUser ? dbUser.id : 'anon', withURLs });

	let conversation;
	if (dbUser) conversation = (await DBgetConversation({ dbUser, id })) as ConversationInterface;
	else conversation = (await DBgetDefaultConversation({ id })) as ConversationInterface;

	if (withURLs && conversation.media) {
		debug('Requested with URLs');
		// Get signed URLs for the media
		const urlPromises = conversation.media.flatMap((m) =>
			[
				m.original && getDownloadURL(m.original).then((url) => (m.original!.url = url)),
				m.resized && getDownloadURL(m.resized).then((url) => (m.resized!.url = url)),
				m.thumbnail && getDownloadURL(m.thumbnail).then((url) => (m.thumbnail!.url = url)),
				m.cropped && getDownloadURL(m.cropped).then((url) => (m.cropped!.url = url))
			].filter(Boolean)
		);

		await Promise.all(urlPromises);

		debug('Converssation media: %o', conversation.media);
	}

	debug('GET %o -> %o', id, conversation);
	return json(conversation);
};
