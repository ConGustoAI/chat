import { DBgetFile } from '$lib/db/utils/file.js';
import { getDownloadURL } from '$lib/utils/files_server.js';
import { error, redirect } from '@sveltejs/kit';
import dbg from 'debug';

const debug = dbg('app:api:bucket');

export async function GET({ params: {id}, locals: { dbUser }, }) {
    debug('GET <- %o', { dbUser: dbUser?.id ?? 'anon' });

    const file = await DBgetFile({ dbUser, id });
    if (file) {
        redirect(307, await getDownloadURL(file as FileInterface));
    }

    error(404, 'File not found');
}

