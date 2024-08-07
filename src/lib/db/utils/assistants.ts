import { error } from '@sveltejs/kit';
import { db } from '..';
import { assistantsTable } from '../schema';
import { undefineExtras } from '$lib/utils';
import { and, eq, sql } from 'drizzle-orm';

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
	const updatedAssistant = await db.transaction(async (tx) => {
		if (assistant.id) {
			// Check the assistant belongs to the user
			const userAssistants = await tx.query.assistantsTable.findFirst({
				where: (table, { eq, and }) => and(eq(table.id, assistant.id!), eq(table.userID, userID)),
				columns: { id: true }
			});

			if (!userAssistants) {
				error(403, 'Tried to update an assistant that does not belong to the user');
			}
		}
		assistant = undefineExtras(assistant);
		assistant.userID = userID;

		console.log('upsert assistant', assistant);
		const insertionResult = await tx
			.insert(assistantsTable)
			// @ts-expect-error - The user ID is added in the previous line
			.values(undefineExtras(assistant))
			.onConflictDoUpdate({
				target: [assistantsTable.id],
				set: {
					model: sql`excluded.model`,
					apiKey: sql`excluded.api_key`,
					name: sql`excluded.name`,
					about: sql`excluded.about`,
					aboutUser: sql`excluded.about_user`,
					aboutUserFromUser: sql`excluded.about_user_from_user`,
					assistantInstructions: sql`excluded.assistant_instructions`,
					assistantInstructionsFromUser: sql`excluded.assistant_instructions_from_user`,
					systemPrompt: sql`excluded.system_prompt`,
					images: sql`excluded.images`,
					audio: sql`excluded.audio`,
					video: sql`excluded.video`,
					prefill: sql`excluded.prefill`
				}
			})
			.returning();

		console.log('insertionResult', insertionResult);

		if (!insertionResult || !insertionResult.length) {
			error(500, 'Failed to update assistant');
		}

		return insertionResult[0];
	});

	return updatedAssistant;
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
