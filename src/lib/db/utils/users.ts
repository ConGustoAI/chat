import { userInterfaceFilter } from '$lib/api';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { usersTable } from '../schema';

export async function DBgetUser({ id }: { id: string }) {
	// Attention: This funciton has no way to check that the user is authorized to get the user data
	// Check that the user is authorized before calling this function
	const user = await db.query.usersTable.findFirst({
		where: (table, { eq }) => eq(table.id, id)
	});

	return user;
}

export async function DBinsertUser({ user }: { user: UserInterface }) {
	// Attention: This funciton has no way to check that the user is authorized to insert a new user
	// Check that the user is authorized before calling this function
	if (!user.id) error(400, 'User ID is required');
	const insert = await db.insert(usersTable).values(user).onConflictDoNothing().returning();

	if (!insert.length) error(500, 'Failed to insert user');
	return insert[0];
}

export async function DBupdateUser({ dbUser, updatedUser }: { dbUser?: UserInterface; updatedUser: UserInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	if (!updatedUser.id) error(400, 'User ID is required');
	if (dbUser.id !== updatedUser.id) error(400, 'User ID mismatch');
	if (!dbUser.admin && updatedUser.admin) error(403, "You can't just make yourself admin lol");

	updatedUser = userInterfaceFilter(updatedUser);
	const update = await db.update(usersTable).set(updatedUser).where(eq(usersTable.id, updatedUser.id)).returning();

	if (!update.length) error(500, 'Failed to update user');
	return update[0];
}

export async function DBdeleteUser({ dbUser }: { dbUser?: UserInterface }) {
	if (!dbUser) error(401, 'Unauthorized');
	const del = await db.delete(usersTable).where(eq(usersTable.id, dbUser.id)).returning({ id: usersTable.id });

	if (!del.length) error(500, 'Failed to delete user');
	return del[0];
}
