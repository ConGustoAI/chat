import { DBdeleteMedia, DBgetMedia } from '$lib/db/utils';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:media:id');

export async function GET({ params: { id }, locals: { session }}) {
	debug('GET <- %o', { id, session: session?.userID ?? 'anon' });
	if (!session) error(401, 'Unauthorized');

	const media = await DBgetMedia({ session, id });

	debug('GET %o -> %o', id, media);
	return json(media);
}

export async function DELETE({ locals: { session }, params: { id } }) {
	if (!session) error(401, 'Unauthorized');
	if (!id) error(400, 'No media ID provided');

	debug('DELETE <- %s', id);

	const deletedMedia = await DBdeleteMedia({ session, id });

	// XXX Files are not deleted. Figure out if we will share files between media objects.
	debug('DELETE -> %s', id);
	return json(deletedMedia);
}
