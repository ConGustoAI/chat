import { db } from '$lib/db';
import { error, json } from '@sveltejs/kit';
import dbg from 'debug';
import type { RequestHandler } from './$types';

const debug = dbg('app:api:search');

export const POST: RequestHandler = async ({ request, locals: { dbUser } }) => {
	const { search } = await request.json();

	if (!dbUser) return error(401, 'Unauthorized');

	debug('Searching conversations for user %s with query: %s', dbUser.id, search);

	const res =  await db.query.messagesTable.findMany({
        where: (table, { eq, ilike, and }) =>
            and(
                eq(table.userID, dbUser.id),
                ilike(table.text, `%${search}%`),
            ),
        columns: {
            conversationID: true,
        },
    });
    const uniqueIds = [...new Set(res.map(item => item.conversationID))];

    debug('Found %o conversations', uniqueIds.length);
    return json(uniqueIds);
};
