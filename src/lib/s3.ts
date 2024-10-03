// We call it s3.ts, but any compatible storage service can be used.
import { env } from '$env/dynamic/private';
import {
	PutObjectCommand,
	S3Client,
	type PutObjectCommandInput,
	type PutObjectCommandOutput
} from '@aws-sdk/client-s3';
import { error } from '@sveltejs/kit';
import dbg from 'debug';
import { Readable } from 'stream';
const debug = dbg('app:s3');

export let s3: S3Client | undefined;

if (env.AWS_REGION || env.AWS_ACCESS_KEY_ID || env.AWS_SECRET_ACCESS_KEY || env.AWS_UPLOAD_BUCKET_NAME) {
	debug('Connecting to S3');
	if (!env.AWS_REGION) throw new Error('Missing AWS_REGION');
	if (!env.AWS_ACCESS_KEY_ID) throw new Error('Missing AWS_ACCESS_KEY_ID');
	if (!env.AWS_SECRET_ACCESS_KEY) throw new Error('Missing AWS_SECRET_ACCESS_KEY');
	if (!env.AWS_UPLOAD_BUCKET_NAME) throw new Error('Missing AWS_UPLOAD_BUCKET_NAME');
	if (!env.AWS_ENDPOINT) debug('no AWS_ENDPOINT provided, using default');

	debug('S3 config: %o', {
		endpoint: env.AWS_ENDPOINT,
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY
		}
	});

	s3 = new S3Client({
		endpoint: env.AWS_ENDPOINT,
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY
		}
	});
}

export async function uploadFileToS3(
	stream: ReadableStream<Uint8Array>,
	key: string,
	contentType: string,
	contentLength: number
) {
	if (!s3) throw new Error('S3 not configured');
	if (!env.AWS_UPLOAD_BUCKET_NAME) throw new Error('Missing AWS_UPLOAD_BUCKET_NAME');

	debug('Uploading file to S3:', key, contentType, contentLength);
	try {
		const uploadParams: PutObjectCommandInput = {
			Bucket: env.AWS_UPLOAD_BUCKET_NAME,
			Key: key,
			Body: Readable.fromWeb(stream),
			ContentType: contentType,
			ContentLength: contentLength
		};

		const command = new PutObjectCommand(uploadParams);
		const uploadResult: PutObjectCommandOutput = await s3.send(command);
		debug('S3 upload result:', uploadResult);
		return uploadResult;
	} catch (err) {
		debug('Error uploading file:', err);
		error(500, 'S3 upload failed: ' + err);
	}

	// debug('S3 upload result:', uploadResult);
	// if (uploadResult.$metadata.httpStatusCode !== 200) {
	// 	error(500, 'S3 upload failed with status code: ' + uploadResult.$metadata.httpStatusCode);
	// }

	// return uploadResult.ETag || '';
}
