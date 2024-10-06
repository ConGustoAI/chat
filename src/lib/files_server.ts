// We call it s3.ts, but any compatible storage service can be used.
import { env } from '$env/dynamic/private';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getSignedUrl as getSignedCloudFrontURL } from '@aws-sdk/cloudfront-signer';
import { getSignedUrl as getSignedS3Url } from '@aws-sdk/s3-request-presigner';

import { error } from '@sveltejs/kit';
import dbg from 'debug';
const debug = dbg('app:lib:files-server');

export let s3: S3Client | undefined;

if (env.AWS_REGION || env.AWS_ACCESS_KEY_ID || env.AWS_SECRET_ACCESS_KEY || env.AWS_UPLOAD_BUCKET_NAME) {
	debug('Connecting to S3');
	if (!env.AWS_REGION) throw new Error('Missing AWS_REGION');
	if (!env.AWS_ACCESS_KEY_ID) throw new Error('Missing AWS_ACCESS_KEY_ID');
	if (!env.AWS_SECRET_ACCESS_KEY) throw new Error('Missing AWS_SECRET_ACCESS_KEY');
	if (!env.AWS_UPLOAD_BUCKET_NAME) throw new Error('Missing AWS_UPLOAD_BUCKET_NAME');
	if (!env.AWS_ENDPOINT) debug('no AWS_ENDPOINT provided, using default');

	const s3Config = {
		endpoint: env.AWS_ENDPOINT,
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY
		}
	};

	debug('env', env);

	// !!!! comment out for production, this leaks the secret key !!!!!
	debug('S3 config: %o', s3Config);

	s3 = new S3Client(s3Config);
}

async function getS3PresignedURLs(file: FileInterface) {
	if (!s3) error(500, 'S3 not configured');
	const base = file.isThumbnail ? 'thumbnail' : 'upload';
	const fileCommand = new GetObjectCommand({
		Bucket: env.AWS_UPLOAD_BUCKET_NAME,
		Key: `${base}/${file.id}`
	});

	return await getSignedS3Url(s3, fileCommand, { expiresIn: 3600 });
}

function getCloudFrontSignedURLs(file: FileInterface) {
	const cloudFrontKeyPairId = env.AWS_CLOUDFRONT_KEY_ID;
	const cloudFrontPrivateKey = env.AWS_CLOUDFRONT_PRIVATE_KEY;

	if (!cloudFrontKeyPairId || !cloudFrontPrivateKey) {
		error(500, 'CloudFront not configured');
	}

	const base = file.isThumbnail ? 'thumbnail' : 'upload';
	return getSignedCloudFrontURL({
		url: `${env.FILES_BASE_URL}/${base}/${file.id}`,
		keyPairId: cloudFrontKeyPairId,
		privateKey: cloudFrontPrivateKey,
		dateLessThan: new Date(Date.now() + 3600 * 1000).toISOString()
	});
}

function getDirectURLs(file: FileInterface) {
	const base = file.isThumbnail ? 'thumbnail' : 'upload';
	return `${env.FILES_BASE_URL}/${base}/${file.id}`;
}

export async function getDownloadURL(file: FileInterface) {
	if (env.FILES_URL_TYPE === 'cloudfront') {
		return getCloudFrontSignedURLs(file);
	} else if (env.FILES_URL_TYPE === 's3') {
		return await getS3PresignedURLs(file);
	}
	return getDirectURLs(file);
}

export async function getUploadURL(file: FileInterface) {
	if (!s3) error(500, 'S3 not configured');

	const base = file.isThumbnail ? 'thumbnail' : 'upload';

	const fileCommand = new PutObjectCommand({
		Bucket: env.AWS_UPLOAD_BUCKET_NAME,
		Key: `${base}/${file.id}`,
		ContentType: file.mimeType,
		ContentLength: file.size
	});

	return await getSignedS3Url(s3, fileCommand, { expiresIn: 3600 });
}

export async function deleteFile(file: FileInterface) {
	if (!s3) error(500, 'S3 not configured');

	const base = file.isThumbnail ? 'thumbnail' : 'upload';
	const deleteCommand = new DeleteObjectCommand({
		Bucket: env.AWS_UPLOAD_BUCKET_NAME,
		Key: `${base}/${file.id}`
	});

	await s3.send(deleteCommand);
}
