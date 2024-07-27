// import type { LayoutServerLoad } from './$types';
// import { usersTable } from '$lib/db/schema';
// import { eq } from 'drizzle-orm';
// import { db } from '$lib/db';
// export const load: LayoutServerLoad = async ({ locals: { session, user }, cookies }) => {
// 	console.log('layout.server.ts load', { session, cookies: cookies.getAll() });
	// let db_user;
	// if (user) {
	// 	db_user = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
	// }
	// console.log('layout.server.ts load', { db_user });

	// return {
	// 	db_user
	// };
// };
