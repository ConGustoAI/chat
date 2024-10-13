import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { promptsTable } from '../schema';
import { promptHash } from '$lib/utils/utils';

export async function DBgetPrompt({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	if (!dbUser) error(401, 'Unauthorized');
	const prompt = await db.query.promptsTable.findFirst({
		where: (table, { eq }) => eq(table.id, id)
	});

	return prompt;
}

export async function DBinsertPrompt({ dbUser, prompt }: { dbUser?: UserInterface; prompt: PromptInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!prompt.id) error(400, 'Prompt ID is required');

    const hash = await promptHash(prompt.text);
    if (hash !== prompt.id) error(500, "Prompt hash mismatch.")

	const upsert = await db.insert(promptsTable).values(prompt).onConflictDoNothing().returning();

    // onConflictDoNothing() does not return the existing prompt
	if (!upsert.length) return prompt;
	return upsert[0];
}

export async function DBdeletePrompt({ dbUser, id }: { dbUser?: UserInterface; id: string }) {
	if (!dbUser) error(401, 'Unauthorized');
	const del = await db.delete(promptsTable).where(eq(promptsTable.id, id)).returning({ id: promptsTable.id });

	if (!del.length) error(500, 'Failed to delete prompt');
	return del[0];
}
