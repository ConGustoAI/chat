import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { hiddenItems } from '../schema';
import { error } from '@sveltejs/kit';

export async function DBhideItem({ session, itemID }: { session?: SessionInterface; itemID: string }) {
	if (!session) error(401, 'Unauthorized');

	return await db
		.insert(hiddenItems)
		.values({
			userID: session.userID,
			itemID
		})
		.onConflictDoNothing();
}

export async function DBunhideItem({ session, itemID }: { session?: SessionInterface; itemID: string }) {
	if (!session) error(401, 'Unauthorized');

	return await db
		.delete(hiddenItems)
		.where(and(eq(hiddenItems.userID, session.userID), eq(hiddenItems.itemID, itemID)))
		.returning();
}

export async function DBgetHiddenItems({ session }: { session?: SessionInterface }) {
	if (!session) return new Set();

	const items = await db.query.hiddenItems.findMany({
		where: eq(hiddenItems.userID, session.userID)
	});
	return new Set(items.map((item) => item.itemID));
}
