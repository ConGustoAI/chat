import { undefineExtras } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { usersTable } from '../schema';

export async function DBgetUser(userID: string) {
	const user = await db.query.usersTable.findFirst({
		where: (table, { eq }) => eq(table.id, userID)
	});

	if (!user) {
		error(404, 'User not found');
	}

	return user;
}

export async function DBupdateUser(user: UserInterface) {
	user = undefineExtras(user);

	const update = await db.update(usersTable).set(user).where(eq(usersTable.id, user.id)).returning();

	if (!update || !update.length) {
		error(500, 'Failed to update user');
	}

	return update[0];
}

export async function DBdeleteUser(userID: string) {
	const res = await db.delete(usersTable).where(eq(usersTable.id, userID)).returning({ id: usersTable.id });

	if (!res || !res.length) {
		error(500, 'Failed to delete user');
	}

	return res[0];
}
