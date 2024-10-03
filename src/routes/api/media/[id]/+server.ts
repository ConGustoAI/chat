import { DBgetMedia, DBdeleteMedia } from '$lib/db/utils';
import { getDownloadURL } from '$lib/files';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:media:id');

export async function GET({ params: { id }, locals: { dbUser }, url }) {
	debug('GET <- %o', { id, dbUser: dbUser?.id ?? 'anon' });
	if (!dbUser) error(401, 'Unauthorized');

	const withURL = url.searchParams.get('url') === 'true';

	const media = await DBgetMedia({ dbUser, id });

	if (withURL) {
		if (media.original) (media.original as FileInterface).url = await getDownloadURL(media.original as FileInterface);
		if (media.resized) (media.resized as FileInterface).url = await getDownloadURL(media.resized as FileInterface);
		if (media.cropped) (media.cropped as FileInterface).url = await getDownloadURL(media.cropped as FileInterface);
		if (media.thumbnail) (media.thumbnail as FileInterface).url = await getDownloadURL(media.thumbnail as FileInterface);
	}

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
