import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = locals;

	if (!user) {
		error(401, 'Unauthorized');
	}

	const assistants = await db.query.assistantsTable.findMany({
		where: (table, { eq }) => eq(table.userID, user.id),
		columns: {
			id: true,
			name: true
		}
	});

	return json(assistants);
};
