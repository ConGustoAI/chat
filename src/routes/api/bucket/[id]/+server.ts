import { DBgetFile } from '$lib/db/utils/file.js';
import { getDownloadURL } from '$lib/utils/files_server.js';
import { error } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:bucket');

export async function GET({ params: { id }, locals: { dbUser } }) {
	debug('GET <- %o', { dbUser: dbUser?.id ?? 'anon', id });

    // return json({ message: 'Bucket endpoint boilerplate' });
	const file = await DBgetFile({ dbUser, id });
	if (file) {
		const maxAge = 3600; // 1 hour, adjust based on your pre-signed URL expiration
		return new Response(null, {
			status: 302,
			headers: {
				Location: await getDownloadURL(file as FileInterface),
				'Cache-Control': `public, max-age=${maxAge}`,
				Expires: new Date(Date.now() + maxAge * 1000).toUTCString()
			}
		});

	}

	error(404, 'File not found');
}
