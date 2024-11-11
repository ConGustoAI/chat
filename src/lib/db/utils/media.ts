import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { mediaTable } from '../schema/media';

export async function DBgetMedia({ session, id }: { session?: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');
	const media = await db.query.mediaTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, session.userID)),
		with: {
			original: true
		}
	});

	if (!media) error(404, 'Media not found or does not belong to the user');

	return media;
}

export async function DBgetAllMedia({ session }: { session?: SessionInterface }) {
	if (!session) error(401, 'Unauthorized');
	const medias = await db.query.mediaTable.findMany({
		where: (table, { eq }) => eq(table.userID, session.userID),
		with: {
			original: true
		}
	});

	if (!medias) error(500, 'Failed to fetch media');

	return medias;
}

export async function DBupsertMedia({ session, media }: { session?: SessionInterface; media: MediaInterface }) {
	if (!session) error(401, 'Unauthorized');

	if (media.id) {
		const update = await db
			.update(mediaTable)
			.set(media)
			.where(and(eq(mediaTable.id, media.id), eq(mediaTable.userID, session.userID)))
			.returning();

		if (!update.length) {
			error(403, 'Tried to update a media that does not exist or does not belong to the user');
		}

		return update[0];
	}

	const insert = await db
		.insert(mediaTable)
		.values({
			...media,
			userID: session.userID
		})
		.returning();

	if (!insert || !insert.length) error(500, 'Failed to insert media');

	return insert[0];
}

export async function DBdeleteMedia({ session, id }: { session?: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');

	const res = await db
		.delete(mediaTable)
		.where(and(eq(mediaTable.id, id), eq(mediaTable.userID, session.userID)))
		.returning({ id: mediaTable.id });

	if (!res.length) error(500, 'Failed to delete media');

	return res[0];
}
