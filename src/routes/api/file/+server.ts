// src/routes/upload/+server.js
import { env as envPublic } from '$env/dynamic/public';
import { DBupsertFile } from '$lib/db/utils';

import { error, json } from '@sveltejs/kit';

import { getUploadURL, s3 } from '$lib/files';

import dbg from 'debug';
const debug = dbg('app:api:file');

export async function POST({ request, locals: { dbUser }, url }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!s3) error(500, 'S3 not configured');

	const file: FileInterface = (await request.json()) as FileInterface;

	// We want to upload a new file - update status and generate upload urls.
	const uploadurl = url.searchParams.get('uploadurl') === 'true';

	debug('POST <- %o', { file, uploadurl });

	// Note: The file size in the header might be wrong, this it just the fast path to give an error imm3diately.
	const maxSize = envPublic.PUBLIC_MAX_FILE_SIZE_MB
		? parseFloat(envPublic.PUBLIC_MAX_FILE_SIZE_MB) * 1024 * 1024
		: +Infinity;

	if (!file.size) error(400, 'No file size');
	if (file.size > maxSize) error(400, 'File too large');
	if (!file.mimeType) error(400, 'No mime type');

	if (uploadurl) {
		file.status = 'progress';
	}

	const insertedFile = (await DBupsertFile({
		dbUser,
		file
	})) as FileInterface;

	if (uploadurl) file.uploadURL = await getUploadURL(insertedFile);

	debug('POST %o -> %o', insertedFile.id, insertedFile);
	return json(insertedFile);
}
