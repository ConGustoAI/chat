import { DBdeleteMedia, DBgetMedia } from '$lib/db/utils';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:media:id');

export async function GET({ params: { id }, locals: { dbUser }}) {
	debug('GET <- %o', { id, dbUser: dbUser?.id ?? 'anon' });
	if (!dbUser) error(401, 'Unauthorized');

	const media = await DBgetMedia({ dbUser, id });

	debug('GET %o -> %o', id, media);
	return json(media);
}

export async function DELETE({ locals: { dbUser }, params: { id } }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!id) error(400, 'No media ID provided');

	debug('DELETE <- %s', id);

	const deletedMedia = await DBdeleteMedia({ dbUser, id });

	// XXX Files are not deleted. Figure out if we will share files between media objects.
	debug('DELETE -> %s', id);
	return json(deletedMedia);
}
