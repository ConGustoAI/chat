import { apiProvidersTable, providerTypes, usersTable } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
export const load = async ({ locals: { session, user }, cookies }) => {
	if (!user) {
		return {
			providers: []
		};
	}
	const providers = await db.select().from(apiProvidersTable).where(eq(apiProvidersTable.userID, user.id));
	console.log('providers +layout.server.ts', { providers });
	// let db_user;
	// if (user) {
	// 	db_user = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
	// }
	// console.log('layout.server.ts load', { providers });

	return {
		providers
		// db_user
	};
};
