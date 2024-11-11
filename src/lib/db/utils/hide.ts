import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { hiddenItems } from '../schema';
import { error } from '@sveltejs/kit';

export async function DBhideItem({ dbUser, itemID }: { dbUser?: UserInterface; itemID: string }) {
	if (!dbUser) error(401, 'Unauthorized');

	return await db
		.insert(hiddenItems)
		.values({
			userID: dbUser.id,
			itemID
		})
		.onConflictDoNothing();
}

export async function DBunhideItem({ dbUser, itemID }: { dbUser?: UserInterface; itemID: string }) {
	if (!dbUser) error(401, 'Unauthorized');

	return await db
		.delete(hiddenItems)
		.where(and(eq(hiddenItems.userID, dbUser.id), eq(hiddenItems.itemID, itemID)))
		.returning();
}

export async function DBgetHiddenItems({ dbUser }: { dbUser?: UserInterface }) {
	if (!dbUser) return new Set();

	const items = await db.query.hiddenItems.findMany({
		where: eq(hiddenItems.userID, dbUser.id)
	});
	return new Set(items.map((item) => item.itemID));
}
