import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { fileTable } from '../schema/file';

export async function DBgetFile({ session, id }: { session?: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');
	const file = await db.query.fileTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, session.userID))
	});

	if (!file) error(404, 'File not found or does not belong to the user');

	return file;
}

export async function DBgetFiles({ session }: { session?: SessionInterface }) {
	if (!session) error(401, 'Unauthorized');
	const files = await db.query.fileTable.findMany({
		where: (table, { eq }) => eq(table.userID, session.userID)
	});

	if (!files) error(500, 'Failed to fetch files');

	return files;
}
export async function DBupsertFile({
	session,
	file
}: {
	session?: SessionInterface;
	file: FileInterface;
}) {
	if (!session) error(401, 'Unauthorized');

	if (file.id) {
		const update = await db
			.update(fileTable)
			.set(file)
			.where(and(eq(fileTable.id, file.id), eq(fileTable.userID, session.userID)))
			.returning();

		if (!update.length) {
			error(403, 'Tried to update a file that does not exist or does not belong to the user');
		}

		return update[0];
	}

	const insert = await db
		.insert(fileTable)
		.values({
			...file,
			userID: session.userID
		})
		.returning();

	if (!insert || !insert.length) error(500, 'Failed to insert file');

	return insert[0];
}

export async function DBdeleteFile({ session, id }: { session?: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');

	const res = await db
		.delete(fileTable)
		.where(and(eq(fileTable.id, id), eq(fileTable.userID, session.userID)))
		.returning({ id: fileTable.id });

	if (!res.length) error(500, 'Failed to delete file');

	return res[0];
}
