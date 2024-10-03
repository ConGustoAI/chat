// src/routes/upload/+server.js
import { env as envPrivate } from '$env/dynamic/private';
import { env as envPublic } from '$env/dynamic/public';
import { DBupsertFile } from '$lib/db/utils';

import { error, json } from '@sveltejs/kit';

import { s3 } from '$lib/s3';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dbg from 'debug';
const debug = dbg('app:upload');

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

	if (uploadurl) {
		const fileCommand = new PutObjectCommand({
			Bucket: envPrivate.AWS_UPLOAD_BUCKET_NAME,
			Key: `upload/${insertedFile.id}`,
			ContentType: file.mimeType,
			ContentLength: file.size
		});

		insertedFile.uploadURL = await getSignedUrl(s3, fileCommand, { expiresIn: 3600 })
	}

	debug('POST %o -> %o', insertedFile.id, insertedFile);
	return json(insertedFile);
}
