import { pgTable, boolean, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgSchema, pgEnum } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');
const AuthUsersTable = authSchema.table('users', {
	id: uuid('id').primaryKey()
});

export const profilesTable = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	user_id: uuid('user_id')
		.references(() => AuthUsersTable.id)
		.notNull(),
	name: text('name').notNull(),
	default_model: text('default_agent').notNull(),
	default_about: text('default_about').notNull(),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const messagesTable = pgTable('messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	conversation_id: uuid('conversation_id')
		.references(() => conversationsTable.id)
		.notNull(),
	role: messageRoleEnum('role').notNull(),
	text: text('text').notNull(),
	imagePaths: text('image_paths').array(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const conversationsTable = pgTable('conversations', {
	id: uuid('id').defaultRandom().primaryKey(),
	user_id: uuid('user_id')
		.references(() => profilesTable.id)
		.notNull(),
	assistant_id: uuid('assistant_id')
		.references(() => assistantsTable.id)
		.notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const assistantsTable = pgTable('assistants', {
	id: uuid('id').defaultRandom().primaryKey(),
	user_id: uuid('user_id')
		.references(() => profilesTable.id)
		.notNull(),
	name: text('name').notNull(),
	about: text('about').notNull(),
	model: uuid('model')
		.references(() => modelsTable.id)
		.notNull(),
	apiKey: uuid('api_key')
		.references(() => apiKeysTable.id)
		.notNull(),
	systemPrompt: text('system_prompt').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const modelsTable = pgTable('models', {
	id: uuid('id').defaultRandom().primaryKey(),
	display_name: text('display_name').notNull(),
	images: boolean('images').notNull().default(false),
	prefill: boolean('prefill').notNull().default(false),
	name: text('name').notNull(),
	provider: uuid('provider')
		.references(() => apiProvidersTable.id)
		.notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const apiProvidersTable = pgTable('api_providers', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	type: text('type').notNull(),
	base_url: text('base_url').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const apiKeysTable = pgTable('api_keys', {
	id: uuid('id').defaultRandom().primaryKey(),
	user_id: uuid('user_id')
		.references(() => profilesTable.id)
		.notNull(),
	provider: uuid('provider')
		.references(() => apiProvidersTable.id)
		.notNull(),
	key: text('key').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export type InsertUser = typeof profilesTable.$inferInsert;
export type SelectUser = typeof profilesTable.$inferSelect;
