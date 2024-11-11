import { DBgetAllMedia, DBupsertMedia } from '$lib/db/utils';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:media');

export async function GET({ locals: { session }}) {
	if (!session) error(401, 'Unauthorized');

	debug('GET <- %o', { session: session ? session.userID : 'no' });

	const media = (await DBgetAllMedia({ session })) as MediaInterface[];

	debug('GET -> %o', media);
	return json(media);
}

export async function POST({ request, locals: { session } }) {
	if (!session) error(401, 'Unauthorized');

	const media = await request.json();
	debug('POST <- %o', media);

	const result = await DBupsertMedia({ session, media });
	debug('POST -> %o', result);
	return json(result);
}
