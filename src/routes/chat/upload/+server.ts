import { error } from '@sveltejs/kit';
import { s3client } from '$lib/upload';
import { PutObjectCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { AWS_UPLOAD_BUCKET_NAME } from '$env/static/private';

export const POST = async ({ request }) => {
	const formData = await request.formData();
	const files = formData.getAll('files') as File[];

	if (!files || files.length === 0) {
		return error(400, 'You must provide a file to upload');
	}

	try {
		for (const file of files) {
			const buffer = await file.arrayBuffer();
			const fileStream = Readable.from(new Uint8Array(buffer));

			console.log('Uploading file:', file);

			const u = new Upload({
				client: s3client,
				params: {
					Bucket: AWS_UPLOAD_BUCKET_NAME,
					Key: file.name,
					Body: fileStream,
					ContentType: file.type
				}
			});
			u.on('httpUploadProgress', (progress) => {
				console.log('Progress:', progress);
			});

			await u.done();
		}

		return new Response(JSON.stringify({ message: 'Files uploaded successfully' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Error uploading file:', err);
		error(500, 'Error uploading file');
	}
};
