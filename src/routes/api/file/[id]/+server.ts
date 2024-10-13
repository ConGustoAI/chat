import { DBdeleteFile, DBgetFile } from '$lib/db/utils';
import { deleteFile, getDownloadURL, s3 } from '$lib/utils/files_server';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:file:id');

export async function GET({ params: { id }, locals: { dbUser }, url }) {
	const withURL = url.searchParams.get('url') === 'true';

	debug('GET <- %o', { id, dbUser: dbUser?.id ?? 'anon' });
	if (!dbUser) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!s3) error(500, 'S3 not configured');

	// Will throw if not found.
	const file = (await DBgetFile({ dbUser, id })) as FileInterface;

	if (withURL) file.url = await getDownloadURL(file);

	debug('GET %o -> %o', file);

	return json(file);
}

export async function DELETE({ locals: { dbUser }, params: { id } }) {
	debug('DELETE <- %o', { id, dbUser: dbUser?.id ?? 'anon' });
	if (!dbUser) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!id) return json({ error: 'No file ID provided' }, { status: 400 });
	if (!s3) error(500, 'S3 not configured');

	// Will throw if not found.
	const file = (await DBdeleteFile({ dbUser, id })) as FileInterface;

	await DBdeleteFile({ dbUser, id });

	await deleteFile(file);

	debug('DELETE -> %s', id);
	file.status = undefined;
	return json(file);
}
