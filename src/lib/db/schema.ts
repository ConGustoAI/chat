import { relations } from 'drizzle-orm';
import { pgTable, boolean, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { pgSchema, pgEnum } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');
const AuthUsersTable = authSchema.table('users', {
	id: uuid('id').primaryKey()
});

export const usersTable = pgTable('users', {
	id: uuid('id')
		.references(() => AuthUsersTable.id, { onDelete: 'cascade' })
		.primaryKey(),
	name: text('name'),
	email: text('email'),
	default_model: text('default_agent'),
	default_about: text('default_about'),
	aboutUser: text('about_user'),
	assistantInstructions: text('assistant_instructions'),
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
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	about: text('about').notNull(),
	model: uuid('model').references(() => modelsTable.id, { onDelete: 'set null' }),
	apiKey: uuid('api_key').references(() => apiKeysTable.id, { onDelete: 'set null' }),
	aboutUser: text('about_user'),
	aboutUserFromUser: boolean('about_user_from_user').notNull().default(true),
	assistantInstructions: text('assistant_instructions'),
	assistantInstructionsFromUser: boolean('assistant_instructions_from_user').notNull().default(true),
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
	inputContext: integer('input_context').notNull().default(8192),
	providerID: uuid('provider').notNull().references(() => providersTable.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const providerTypes = pgEnum('provider_types', ['openai', 'anthropic', 'google']);

export const providersTable = pgTable('providers', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id)
		.notNull(),
	name: text('name').notNull().unique(),
	type: providerTypes('type').notNull(),
	baseURL: text('base_url').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const apiKeysTable = pgTable('api_keys', {
	id: uuid('id').defaultRandom().primaryKey(),
	providerID: uuid('provider')
		.references(() => providersTable.id)
		.notNull(),
	label: text('label').notNull(),
	key: text('key').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

// RELATIONS

export const userTableRelations = relations(usersTable, ({ many }) => ({
	providers: many(providersTable),
	assistants: many(assistantsTable),
	conversations: many(conversationsTable),
	apiKeys: many(apiKeysTable)
}));

export const modelsTableRelations = relations(modelsTable, ({ one, many }) => ({
	provider: one(providersTable, {
		fields: [modelsTable.providerID],
		references: [providersTable.id]
	}),
	assistants: many(assistantsTable)
}));

export const providerTableRelations = relations(providersTable, ({ one, many }) => ({
	users: one(usersTable, {
		fields: [providersTable.userID],
		references: [usersTable.id]
	}),
	apiKeys: many(apiKeysTable),
	models: many(modelsTable),
}));

export const apiKeyTableRelations = relations(apiKeysTable, ({ one, many }) => ({
	providers: one(providersTable, {
		fields: [apiKeysTable.providerID],
		references: [providersTable.id]
	}),
	assistants: many(assistantsTable)
}));

export const assistantTableRelations = relations(assistantsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [assistantsTable.userID],
		references: [usersTable.id]
	}),
	model: one(modelsTable, {
		fields: [assistantsTable.model],
		references: [modelsTable.id]
	}),
	apiKey: one(apiKeysTable, {
		fields: [assistantsTable.apiKey],
		references: [apiKeysTable.id]
	})
}));
