import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { hiddenAssistants } from '../schema';

export async function DBaddHiddenAssistant(userId: string, assistantId: string) {
	const upsert = await db.insert(hiddenAssistants).values({ assistantId, userId }).onConflictDoNothing().returning();

	if (!upsert || !upsert.length) {
		error(500, 'Failed to add hidden assistant');
	}

	return upsert[0];
}

export async function DBdeleteHiddenAssistant(userId: string, assistantId: string) {
	const res = await db
		.delete(hiddenAssistants)
		.where(and(eq(hiddenAssistants.userId, userId), eq(hiddenAssistants.assistantId, assistantId)))
		.returning();

	if (!res || !res.length) {
		error(500, 'Failed to delete hidden assistant');
	}

	return res[0];
}

export async function DBgetHiddenAssistants(userId: string) {
	const result = await db
		.select()
		.from(hiddenAssistants)
		.where(eq(hiddenAssistants.userId, userId));

	return result;
}
