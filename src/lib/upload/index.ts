import { S3Client } from '@aws-sdk/client-s3';
import { AWS_REGUION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';

export const s3client = new S3Client({
	region: AWS_REGUION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY
	}
});
