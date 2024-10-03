import { env as envPrivate } from '$env/dynamic/private';

import { DBdeleteFile, DBgetFile } from '$lib/db/utils';
import { s3 } from '$lib/s3';
import { DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getSignedS3Url } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getSignedCloudFrontURL } from '@aws-sdk/cloudfront-signer';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:file:id');

async function getS3PresignedURLs(file: FileInterface) {
	if (!s3) error(500, 'S3 not configured');
	const fileCommand = new GetObjectCommand({
		Bucket: envPrivate.AWS_UPLOAD_BUCKET_NAME,
		Key: `upload/${file.id}`
	});

	const previewCommand = file.hasPreview
		? new GetObjectCommand({
				Bucket: envPrivate.AWS_UPLOAD_BUCKET_NAME,
				Key: `upload/${file.id}-preview`
			})
		: null;

	// Generate signed URLs using Promise.all
	const [signedUrl, previewSignedUrl] = await Promise.all([
		getSignedS3Url(s3, fileCommand, { expiresIn: 3600 }),
		previewCommand ? getSignedS3Url(s3, previewCommand, { expiresIn: 3600 }) : Promise.resolve(undefined)
	]);

	file.url = signedUrl;
	file.previewURL = previewSignedUrl;
}

async function getCloudFrontSignedURLs(file: FileInterface) {
	const cloudFrontKeyPairId = envPrivate.AWS_CLOUDFRONT_KEY_ID;
	const cloudFrontPrivateKey = envPrivate.AWS_CLOUDFRONT_PRIVATE_KEY;

	if (!cloudFrontKeyPairId || !cloudFrontPrivateKey) {
		error(500, 'CloudFront not configured');
	}

	const cloudFrontSignedUrl = getSignedCloudFrontURL({
		url: `${envPrivate.FILES_BASE_URL}/upload/${file.id}`,
		keyPairId: cloudFrontKeyPairId,
		privateKey: cloudFrontPrivateKey,
		dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString()
	});

	file.url = cloudFrontSignedUrl;

	if (file.hasPreview) {
		const cloudFrontPreviewSignedUrl = getSignedCloudFrontURL({
			url: `${envPrivate.FILES_BASE_URL}/upload/${file.id}-preview`,
			keyPairId: cloudFrontKeyPairId,
			privateKey: cloudFrontPrivateKey,
			dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString()
		});

		file.previewURL = cloudFrontPreviewSignedUrl;
	}
}

async function getDirectURLs(file: FileInterface) {
	file.url = `${envPrivate.FILES_BASE_URL}/upload/${file.id}`;
	if (file.hasPreview) {
		file.previewURL = `${envPrivate.FILES_BASE_URL}/upload/${file.id}-preview`;
	}
}


export async function GET({ params, locals: { dbUser } }) {
	if (!dbUser) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!s3) error(500, 'S3 not configured');

	const { id } = params;
	debug('GET <- %o', { id, dbUser: dbUser ? 'yes' : 'no' });

	try {
		// Check if the file exists in the database
		const file = (await DBgetFile({ dbUser, id })) as FileInterface;
		if (!file) error(404, 'File not found');

		if (envPrivate.FILES_URL_TYPE === 'cloudfront') {
			await getCloudFrontSignedURLs(file);
		} else if (envPrivate.FILES_URL_TYPE === 's3') {
			await getS3PresignedURLs(file);
		} else {
			await getDirectURLs(file);
		}

		// Get S3 pre-signed URLs. Thie requires a request to S3 to get the URL for
		// every file, so it's slow. We use CloudFront in front of S3, which lets you
		// sign URLs with a private key locally, so it's fast.

		// If CluldFront is not configured, we just give the direct URLs
		// FILES_BASE_URL/upload/${id} and FILES_BASE_URL/upload/${id}-preview

		debug('GET %o -> %o', id, file);

		return json(file);
	} catch (err) {
		debug('Error fetching file:', err);
		error(500, 'Failed to fetch file');
	}
}

export async function DELETE({ locals: { dbUser }, params: { id } }) {
	if (!dbUser) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!id) return json({ error: 'No file ID provided' }, { status: 400 });
	if (!s3) error(500, 'S3 not configured');

	debug('DELETE <- %s', id);
	// Will throw if not found.
	const file = (await DBgetFile({ dbUser, id })) as FileInterface;

	await DBdeleteFile({ dbUser, id });

	// Delete the file and preview (if exists) from S3
	const objectsToDelete = [{ Key: `upload/${id}` }, ...(file.hasPreview ? [{ Key: `upload/${id}-preview` }] : [])];

	const deleteCommand = new DeleteObjectsCommand({
		Bucket: envPrivate.AWS_UPLOAD_BUCKET_NAME,
		Delete: { Objects: objectsToDelete }
	});

	try {
		await s3.send(deleteCommand);
		debug('Deleted file and preview (if exists) from S3: %s', id);
	} catch (error) {
		console.error('Error deleting file and preview from S3:', error);
	}

	debug('DELETE -> %s', id);
	file.status = undefined;
	file.previewStatus = undefined;
	return json(file);
}
