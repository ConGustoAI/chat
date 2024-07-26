import { pgTable, boolean, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgSchema, pgEnum } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');
const AuthUsersTable = authSchema.table('users', {
	id: uuid('id').primaryKey()
});

export const usersTable = pgTable('users', {
	id: uuid('id')
		.references(() => AuthUsersTable.id, { onDelete: 'cascade' })
		.primaryKey(),
	name: text('name')
		.notNull()
		.$default(() => 'User'),
	default_model: text('default_agent'),
	default_about: text('default_about'),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const messagesTable = pgTable('messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	conversation_id: uuid('conversation_id')
		.references(() => conversationsTable.id, { onDelete: 'cascade' })
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
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	assistant_id: uuid('assistant_id').references(() => assistantsTable.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const assistantsTable = pgTable('assistants', {
	id: uuid('id').defaultRandom().primaryKey(),
	user_id: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	about: text('about').notNull(),
	model: uuid('model').references(() => modelsTable.id, { onDelete: 'set null' }),
	apiKey: uuid('api_key').references(() => apiKeysTable.id, { onDelete: 'set null' }),
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
	provider: uuid('provider').references(() => apiProvidersTable.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const providerTypes = pgEnum('provider_types', ['openai', 'anthropic', 'google']);

export const apiProvidersTable = pgTable('api_providers', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id)
		.notNull(),
	name: text('name').notNull().unique(),
	displayName: text('display_name').notNull().unique(),
	type: providerTypes('type').notNull(),
	baseURL: text('base_url').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const apiKeysTable = pgTable('api_keys', {
	id: uuid('id').defaultRandom().primaryKey(),
	user_id: uuid('user_id')
		.references(() => usersTable.id)
		.notNull(),
	provider: uuid('provider')
		.references(() => apiProvidersTable.id)
		.notNull(),
	key: text('key').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
