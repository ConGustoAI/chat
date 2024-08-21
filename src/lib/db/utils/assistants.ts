import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { assistantsTable, defaultsUUID } from '../schema';

export async function DBgetAssistants({ dbUser }: { dbUser?: UserInterface }) {
	// Note: If the user is not authorized, we only return the default assistants.
	const assistants = await db.query.assistantsTable.findMany({
		where: (table, { eq, or }) => or(dbUser ? eq(table.userID, dbUser.id) : undefined, eq(table.userID, defaultsUUID)),
		orderBy: (table, { asc }) => asc(table.updatedAt)
	});

	return assistants;
}

export async function DBgetAssistant({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	// Note: If the user is not authorized, we only return the default assistant.
	if (!id) error(400, 'Assistant ID is required');

	const assistant = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and, or }) =>
			and(eq(table.id, id), or(dbUser ? eq(table.userID, dbUser.id) : undefined, eq(table.userID, defaultsUUID)))
	});

	if (!assistant) {
		error(404, 'Assistant not found or does not belong to the user');
	}

	return assistant;
}

export async function DBupsertsAssistant({
	dbUser,
	assistant
}: {
	dbUser?: UserInterface;
	assistant: AssistantInterface;
}) {
	if (!dbUser) error(401, 'Unauthorized');
	if (assistant.userID != dbUser.id && (!dbUser.admin || assistant.userID !== defaultsUUID))
		error(401, 'Tried to delete an assistant that does not belong to the user');

	assistant = undefineExtras(assistant);
	if (assistant.id) {
		const update = await db
			.update(assistantsTable)
			.set(assistant)
			.where(and(eq(assistantsTable.id, assistant.id), eq(assistantsTable.userID, assistant.userID)))
			.returning();

		if (!update?.length) {
			error(403, 'Tried to update an assistant that does not exist or does not belong to the user');
		}
		return update[0];
	}

	const insert = await db.insert(assistantsTable).values(assistant).onConflictDoNothing().returning();

	if (!insert?.length) error(500, 'Failed to update assistant');

	return insert[0];
}

export async function DBdeleteAssistant({
	dbUser,
	assistant
}: {
	dbUser?: UserInterface;
	assistant: AssistantInterface;
}) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!assistant.id) error(400, 'Assistant ID is required');
	if (assistant.userID != dbUser.id && (!dbUser.admin || assistant.userID !== defaultsUUID))
		error(401, 'Tried to delete an assistant that does not belong to the user');

	const res = await db
		.delete(assistantsTable)
		.where(and(eq(assistantsTable.id, assistant.id), eq(assistantsTable.userID, assistant.userID)))
		.returning({ id: assistantsTable.id });

	if (!res.length) error(500, 'Failed to delete assistant');
	return res[0];
}
