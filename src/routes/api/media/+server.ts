import { DBgetAllMedia, DBupsertMedia } from '$lib/db/utils';
import { getDownloadURL } from '$lib/utils/files_server';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:media');

export async function GET({ locals: { dbUser }, url }) {
	if (!dbUser) error(401, 'Unauthorized');

	const withURL = url.searchParams.get('url') === 'true';
	debug('GET <- %o', { dbUser: dbUser ? 'yes' : 'no' });

	const media = (await DBgetAllMedia({ dbUser })) as MediaInterface[];
	if (withURL) {
		for (const m of media) {
			if (m.thumbnail) (m.thumbnail as FileInterface).url = await getDownloadURL(m.thumbnail as FileInterface);
		}
	}

	debug('GET -> %o', media);
	return json(media);
}

export async function POST({ request, locals: { dbUser } }) {
	if (!dbUser) error(401, 'Unauthorized');

	const media = await request.json();
	debug('POST <- %o', media);

	const result = await DBupsertMedia({ dbUser, media });
	debug('POST -> %o', result);
	return json(result);
}
