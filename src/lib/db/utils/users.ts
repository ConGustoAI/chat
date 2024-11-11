import { userInterfaceFilter } from '$lib/api';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { sessionsTable, usersTable } from '../schema';
import dbg from 'debug';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const debug = dbg('app:db:users');

export async function DBgetUser({ id }: { id: string }) {
	// Attention: This funciton has no way to check that the user is authorized to get the user data
	// Check that the user is authorized before calling this function
	const user = await db.query.usersTable.findFirst({
		where: (table, { eq }) => eq(table.id, id)
	});

	return user;
}

export async function DBinsertUser({ user }: { user: UserInterface & { id: string } }) {
	// Attention: This funciton has no way to check that the user is authorized to insert a new user
	// Check that the user is authorized before calling this function
	if (!user.id) error(400, 'User ID is required');
	const insert = await db.insert(usersTable).values(user).onConflictDoNothing().returning();

	if (!insert.length) error(500, 'Failed to insert user');
	return insert[0];
}

export async function DBupdateUser({ session, updatedUser }: { session?: SessionInterface; updatedUser: UserInterface }) {
	if (!session) error(401, 'Unauthorized');
	if (!updatedUser.id) error(400, 'User ID is required');
	if (session.userID !== updatedUser.id) error(400, 'User ID mismatch');
	if (!session.user?.admin && updatedUser.admin) error(403, "You can't just make yourself admin lol");

	updatedUser = userInterfaceFilter(updatedUser);
	const update = await db.update(usersTable).set(updatedUser).where(eq(usersTable.id, updatedUser.id)).returning();

	if (!update.length) error(500, 'Failed to update user');
	return update[0];
}

export async function DBdeleteUser({ session, id }: { session: SessionInterface; id: string }) {
	if (!session) error(401, 'Unauthorized');
	// We might let super-admins delete users at some point, but for now you can only delete yourself.
	if (session.userID !== id) error(400, 'User ID mismatch');
	const del = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });

	if (!del.length) error(500, 'Failed to delete user');
	return del[0];
}

export async function DBUpdateSession(session: SessionInterface) {
	if (!session.id) error(400, 'Session ID is required');
	const update = await db.update(sessionsTable).set(session).where(eq(sessionsTable.id, session.id)).returning();

	if (!update.length) error(500, 'Failed to update session');
	return update[0];
}

export async function DBInsertSession(session: SessionInterface) {
	const insert = await db.insert(sessionsTable).values(session).returning();

	if (!insert.length) error(500, 'Failed to insert session');
	return insert[0];
}

export async function DBGetSession(id: string, fullUser: boolean = false) {
	const session = await db.query.sessionsTable.findFirst({
		where: (table, { eq }) => eq(table.id, id),
		with: {
			user: fullUser ? true : {
				columns: {
					id: true,
					admin: true,
				}
			}
		}
	});

	return session;
}

export async function DBDeleteSession(id: string) {
	const del = await db.delete(sessionsTable).where(eq(sessionsTable.id, id)).returning({ id: sessionsTable.id });

	if (!del.length) error(500, 'Failed to delete session');
	return del[0];
}

export async function DBDeleteAllSessions(userID: string) {
	const del = await db.delete(sessionsTable).where(eq(sessionsTable.userID, userID)).returning({ id: sessionsTable.id });

	if (!del.length) error(500, 'Failed to delete sessions');
	return del;
}
