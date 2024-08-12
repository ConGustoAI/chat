import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import dbg from 'debug';

const debug = dbg('app:api:history');

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = locals;

	debug('GET');

	if (!user) {
		error(401, 'Unauthorized');
	}

	const conversations = await db.query.conversationsTable.findMany({
		where: (table, { eq }) => eq(table.userID, user.id),
		columns: {
			id: true,
			summary: true,
			like: true,
			assistant: true,
			createdAt: true
		},
		orderBy: (table, { desc }) => desc(table.createdAt)
	});

	debug('GET -> %o', conversations);
	return json(conversations);
};
