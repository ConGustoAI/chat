import { db } from '$lib/db';
import { conversationsTable } from '$lib/db/schema';
import { type RequestHandler, error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals, params: { chat } }) => {
	// console.log(`POST /chats/[chat]update/`, { request: await request.json(), locals, chat });

	if (typeof chat !== 'string') {
		error(400, 'Invalid chat ID');
	}

	const { user } = locals;
	if (!user) {
		error(401, 'Unauthorized');
	}
	const data = (await request.json()) as Partial<typeof conversationsTable.$inferInsert>;
	console.log(`POST /chats/[{}]update/`, { data });
	const id = await db.transaction(async (tx) => {
		const updatedIds = await tx
			.update(conversationsTable)
			.set(data)
			.where(and(eq(conversationsTable.userID, user.id), eq(conversationsTable.id, chat)))
			.returning({ id: conversationsTable.id });

		if (!updatedIds.length) {
			error(404, 'Chat not found');
		}
		if (updatedIds[0].id !== chat) {
			error(403, 'Chat ID mismatch');
		}

		return updatedIds[0].id;
	});

	console.log(`POST /chats/[{}]update/`, { id });

	return new Response();
};
