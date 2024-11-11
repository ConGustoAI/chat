import { assistantInterfaceFilter } from '$lib/api';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { assistantsTable, defaultsUUID } from '../schema';

export async function DBgetAssistants({ session }: { session?: SessionInterface }) {
	// Note: If the user is not authorized, we only return the default assistants.
	const assistants = await db.query.assistantsTable.findMany({
		where: (table, { eq, or }) =>
			or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)),
		orderBy: (table, { asc }) => asc(table.name)
	});

	return assistants;
}

export async function DBgetAssistant({ session, id }: { session?: SessionInterface; id: string }) {
	// Note: If the user is not authorized, we only return the default assistant.
	if (!id) error(400, 'Assistant ID is required');

	const assistant = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and, or }) =>
			and(eq(table.id, id), or(session ? eq(table.userID, session.userID) : undefined, eq(table.userID, defaultsUUID)))
	});

	if (!assistant) {
		error(404, 'Assistant not found or does not belong to the user');
	}

	return assistant;
}

export async function DBupsertsAssistant({
	session,
	assistant
}: {
	session?: SessionInterface;
	assistant: AssistantInterface;
}) {
	if (!session) error(401, 'Unauthorized');
	if (assistant.userID != session.userID && (!session.user?.admin || assistant.userID !== defaultsUUID))
		error(401, 'Tried to delete an assistant that does not belong to the user');

	assistant = assistantInterfaceFilter(assistant);
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
	session,
	assistant
}: {
	session?: SessionInterface;
	assistant: AssistantInterface;
}) {
	if (!session) error(401, 'Unauthorized');
	if (!assistant.id) error(400, 'Assistant ID is required');
	if (assistant.userID != session.userID && (!session.user?.admin || assistant.userID !== defaultsUUID))
		error(401, 'Tried to delete an assistant that does not belong to the user');

	const res = await db
		.delete(assistantsTable)
		.where(and(eq(assistantsTable.id, assistant.id), eq(assistantsTable.userID, assistant.userID)))
		.returning({ id: assistantsTable.id });

	if (!res.length) error(500, 'Failed to delete assistant');
	return res[0];
}
