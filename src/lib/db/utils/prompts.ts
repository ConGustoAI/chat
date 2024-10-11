import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { promptsTable } from '../schema';

export async function DBgetPrompt({ id }: { id: string }) {
	const prompt = await db.query.promptsTable.findFirst({
		where: (table, { eq }) => eq(table.id, id)
	});

	return prompt;
}

export async function DBinsertPrompt(prompt: PromptInterface) {
	if (!prompt.id) error(400, 'Prompt ID is required');

	const upsert = await db.insert(promptsTable).values(prompt).onConflictDoNothing().returning();

    // onConflictDoNothing() does not return the existing prompt
	if (!upsert.length) return prompt;
	return upsert[0];
}

export async function DBdeletePrompt({ id }: { id: string }) {
	const del = await db.delete(promptsTable).where(eq(promptsTable.id, id)).returning({ id: promptsTable.id });

	if (!del.length) error(500, 'Failed to delete prompt');
	return del[0];
}
