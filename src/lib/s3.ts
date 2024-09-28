// We call it s3.ts, but any compatible storage service can be used.
import { env } from '$env/dynamic/private';
import { S3Client } from '@aws-sdk/client-s3';
import dbg from 'debug';
const debug = dbg('app:s3');

export let s3: S3Client|undefined;

if (env.AWS_REGION || env.AWS_ACCESS_KEY_ID || env.AWS_SECRET_ACCESS_KEY || env.AWS_BUCKET) {
    debug('Connecting to S3');
    if (!env.AWS_REGION) throw new Error('Missing AWS_REGION');
    if (!env.AWS_ACCESS_KEY_ID) throw new Error('Missing AWS_ACCESS_KEY_ID');
    if (!env.AWS_SECRET_ACCESS_KEY) throw new Error('Missing AWS_SECRET_ACCESS_KEY');
    if (!env.AWS_BUCKET) throw new Error('Missing AWS_BUCKET');

    s3 = new S3Client({
        region: env.AWS_REGION,
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY
        }
    });
}


