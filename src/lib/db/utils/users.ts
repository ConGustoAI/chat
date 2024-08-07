import { error } from '@sveltejs/kit';
import { db } from '../index';
import { usersTable } from '../schema';
import { undefineExtras } from '$lib/utils';
import { eq, sql } from 'drizzle-orm';

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

	const insertionResult = await db
		.insert(usersTable)
		.values(user)
		.onConflictDoUpdate({
			target: [usersTable.id],
			set: {
				name: sql`excluded.name`,
				email: sql`excluded.email`,
				defaultAgent: sql`excluded.default_agent`,
				defaultAbout: sql`excluded.default_about`,
				aboutUser: sql`excluded.about_user`,
				assistantInstructions: sql`excluded.assistant_instructions`
			}
		})
		.returning();

	if (!insertionResult || !insertionResult.length) {
		error(500, 'Failed to update user');
	}

	return insertionResult[0];
}

export async function DBdeleteUser(userID: string) {
	const res = await db.delete(usersTable).where(eq(usersTable.id, userID)).returning({ id: usersTable.id });

	if (!res || !res.length) {
		error(500, 'Failed to delete user');
	}

	return res[0];
}
