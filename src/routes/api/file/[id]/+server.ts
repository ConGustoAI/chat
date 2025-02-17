import { DBdeleteFile, DBgetFile } from '$lib/db/utils';
import { deleteFile, s3 } from '$lib/utils/files_server';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:file:id');

export async function GET({ params: { id }, locals: { session } }) {

	debug('GET <- %o', { id, session: session?.userID ?? 'anon' });
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!s3) error(500, 'S3 not configured');

	// Will throw if not found.
	const file = (await DBgetFile({ session, id })) as FileInterface;

	debug('GET %o -> %o', file);

	return json(file);
}

export async function DELETE({ locals: { session }, params: { id } }) {
	debug('DELETE <- %o', { id, session: session?.userID ?? 'anon' });
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!id) return json({ error: 'No file ID provided' }, { status: 400 });
	if (!s3) error(500, 'S3 not configured');

	// Will throw if not found.
	const file = (await DBdeleteFile({ session, id })) as FileInterface;

	await DBdeleteFile({ session, id });

	await deleteFile(file);

	debug('DELETE -> %s', id);
	file.status = undefined;
	return json(file);
}
