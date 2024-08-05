import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = locals;

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

	return json(conversations);
};
