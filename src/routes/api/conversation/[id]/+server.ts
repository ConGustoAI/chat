import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ locals, params: { id } }) => {
	const { user } = locals;

	if (!user) {
		error(401, 'Unauthorized');
	}
	const conversations = await db.query.conversationsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.userID, user.id), eq(table.id, id)),
		columns: {
			id: true,
			summary: true,
			like: true,
			assistant: true
		},
		with: {
			messages: { orderBy: (table, { asc }) => asc(table.createdAt) }
		}
	});

	console.log(`GET /conversation/${id}:`, { conversations });

	return json(conversations ?? {});
};
