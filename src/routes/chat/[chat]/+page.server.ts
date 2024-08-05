import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import { and } from 'drizzle-orm';

export const load = async ({ locals: { user }, params: { chat } }) => {
	if (!user) {
		error(401, 'Unauthorized');
	}

	const conversation = await db.query.conversationsTable.findFirst({
		where: (table, { eq }) => and(eq(table.userID, user.id), eq(table.id, chat)),
		with: {
			messages: {
				columns: {
					id: true,
					text: true,
					role: true
				}
			}
		}
	});

	console.log('conversation', conversation);

	return { conversation };
};
