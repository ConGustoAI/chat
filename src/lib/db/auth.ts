// import { dev } from '$app/environment';
// import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
// import { Lucia } from 'lucia';

// import { db } from './index';
// import { authSessionsTable, authUsersTable } from './schema';

// const adapter = new DrizzlePostgreSQLAdapter(db, authSessionsTable, authUsersTable);

// export const lucia = new Lucia(adapter, {
// 	sessionCookie: {
// 		attributes: {
// 			// set to `true` when using HTTPS
// 			secure: !dev
// 		}
// 	},
// 	getUserAttributes: (attributes) => {
// 		return {
// 			email: attributes.email,
// 			username: attributes.username,
// 			avatar_url: attributes.avatar_url
// 		};

// 	}
// });

// declare module 'lucia' {
// 	interface Register {
// 		Lucia: typeof lucia;
// 		DatabaseUserAttributes: DatabaseUserAttributes;
// 	}
// }

// interface DatabaseUserAttributes {
// 	email: string;
// 	username: string;
// 	avatar_url: string;
// }
