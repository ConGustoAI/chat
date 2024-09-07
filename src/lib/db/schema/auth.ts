import { pgTable, uuid, text,  timestamp } from 'drizzle-orm/pg-core';

export const authUsersTable = pgTable('auth_user', {
	id: uuid('id').primaryKey().defaultRandom(),
	username: text('username'),
	email: text('email').notNull().unique(),
	github_id: text('github_id').unique(),
    google_id: text('google_id').unique(),
	avatar_url: text('avatar_url')
});

// export const authSessionsTable = pgTable('auth_session', {
// 	id: text('id').primaryKey(),
// 	userId: uuid('user_id')
// 		.notNull()
// 		.references(() => authUsersTable.id),
// 	activeExpires: bigint('active_expires', { mode: 'number' }).notNull(),
// 	idleExpires: bigint('idle_expires', { mode: 'number' }).notNull()
// });

export const authSessionsTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => authUsersTable.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull()
});

// export const authKeystable = pgTable('auth_key', {
// 	id: text('id').primaryKey(),
// 	userId: uuid('user_id')
// 		.notNull()
// 		.references(() => authUsersTable.id),
// 	hashedPassword: text('hashed_password')
// });
