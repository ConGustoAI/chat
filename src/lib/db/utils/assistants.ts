import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { assistantsTable } from '../schema';

export async function DBgetAssistants(userID: string) {
	const assistants = await db.query.assistantsTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID)
	});

	return assistants;
}

export async function DBgetAssistant(id: string, userID: string) {
	const assistant = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, userID))
	});

	if (!assistant) {
		error(404, 'Assistant not found or does not belong to the user');
	}

	return assistant;
}

export async function DBupsertsAssistant(assistant: AssistantInterface, userID: string) {
	assistant = undefineExtras(assistant);
	assistant.userID = userID;

	if (assistant.id) {
		const update = await db
			.update(assistantsTable)
			.set(assistant)
			.where(and(eq(assistantsTable.id, assistant.id!), eq(assistantsTable.userID, userID)))
			.returning();

		if (!update?.length) {
			error(403, 'Tried to update an assistant that does not exist or does not belong to the user');
		}
		return update[0];
	}

	const insert = await db
		.insert(assistantsTable)
		// @ts-expect-error - The user ID is added in the previous line
		.values(assistant)
		.onConflictDoNothing()
		.returning();

	if (!insert?.length) {
		error(500, 'Failed to update assistant');
	}

	return insert[0];
}

export async function DBdeleteAssistant(id: string, userID: string) {
	const res = await db
		.delete(assistantsTable)
		.where(and(eq(assistantsTable.id, id), eq(assistantsTable.userID, userID)))
		.returning({ id: assistantsTable.id });
	if (!res) {
		error(500, 'Failed to delete provider');
	}

	return res;
}
