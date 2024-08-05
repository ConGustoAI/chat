import { relations } from 'drizzle-orm';
import { pgTable, boolean, text, timestamp, uuid, integer, real } from 'drizzle-orm/pg-core';
import { pgSchema, pgEnum } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');
export const AuthUsersTable = authSchema.table('users', {
	id: uuid('id').primaryKey()
});

export const defaultsUUID = '00000000-0000-0000-0000-000000000000';

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

export const mediaTypes = pgEnum('media_types', ['image', 'audio', 'video']);
export const mediaUploadStatus = pgEnum('media_upload_status', ['pending', 'uploaded', 'failed']);
export const mediaTable = pgTable('media', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	type: mediaTypes('type').notNull(),
	filename: text('filename').notNull(),
	filetype: text('filetype').notNull(),
	fileID: uuid('file_id').notNull(),
	hash: text('hash').notNull(),
	filesize: integer('filesize').notNull(),
	width: integer('image_width'),
	height: integer('image_height'),
	duration: integer('duration'),
	uploadStatus: mediaUploadStatus('upload_status').notNull().default('pending'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const messagesTable = pgTable('messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	conversationId: uuid('conversation_id')
		.references(() => conversationsTable.id, { onDelete: 'cascade' })
		.notNull(),
	role: messageRoleEnum('role').notNull(),
	text: text('text').notNull(),
	usageIn: integer('usage_in').default(0),
	usageOut: integer('usage_out').default(0),
	requestID: text('request_id'),
	finishReason: text('finish_reason'),
	deleted: boolean('deleted').default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const messageMediaTable = pgTable('message_media', {
	messageId: uuid('message_id')
		.references(() => messagesTable.id, { onDelete: 'cascade' })
		.notNull(),
	mediaId: uuid('media_id')
		.references(() => mediaTable.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const conversationsTable = pgTable('conversations', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	assistant: uuid('assistant_id').references(() => assistantsTable.id, { onDelete: 'set null' }),
	summary: text('title'),
	like: boolean('like').default(false),
	deleted: boolean('deleted').default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const assistantsTable = pgTable('assistants', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull().default('Assistant'),
	about: text('about'),
	model: uuid('model').references(() => modelsTable.id, { onDelete: 'set null' }),
	apiKey: uuid('api_key').references(() => apiKeysTable.id, { onDelete: 'set null' }),
	aboutUser: text('about_user'),
	aboutUserFromUser: boolean('about_user_from_user').notNull().default(true),
	assistantInstructions: text('assistant_instructions'),
	assistantInstructionsFromUser: boolean('assistant_instructions_from_user').notNull().default(true),
	systemPrompt: text('system_prompt').notNull().default(''),
	images: boolean('images').notNull().default(false),
	audio: boolean('audio').notNull().default(false),
	video: boolean('video').notNull().default(false),
	prefill: boolean('prefill').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const modelsTable = pgTable('models', {
	id: uuid('id').defaultRandom().primaryKey(),
	display_name: text('display_name').notNull(),
	images: boolean('images').notNull().default(false),
	maxImages: integer('max_images'),
	imageTokens: real('image_tokens'), // tokens per pixel
	audio: boolean('audio').notNull().default(false),
	maxAudio: integer('max_audio'),
	audioTokens: real('audio_tokens'), // tokens per second
	video: boolean('video').notNull().default(false),
	maxVideo: integer('max_video'),
	videoTokens: real('video_tokens'), // tokens per second
	prefill: boolean('prefill').notNull().default(false),
	name: text('name').notNull(),
	inputContext: integer('input_context').notNull().default(8192),
	providerID: uuid('provider')
		.notNull()
		.references(() => providersTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const providerTypes = pgEnum('provider_types', ['openai', 'anthropic', 'google']);

export const providersTable = pgTable('providers', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	type: providerTypes('type').notNull(),
	baseURL: text('base_url').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').$onUpdate(() => new Date())
});

export const apiKeysTable = pgTable('api_keys', {
	id: uuid('id').defaultRandom().primaryKey(),
	providerID: uuid('provider')
		.references(() => providersTable.id, { onDelete: 'cascade' })
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
	media: many(mediaTable)
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
	models: many(modelsTable)
}));

export const apiKeyTableRelations = relations(apiKeysTable, ({ one, many }) => ({
	providers: one(providersTable, {
		fields: [apiKeysTable.providerID],
		references: [providersTable.id]
	}),
	assistants: many(assistantsTable)
}));

export const assistantTableRelations = relations(assistantsTable, ({ one, many }) => ({
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
	}),
	conversations: many(conversationsTable)
}));

export const conversationTableRelations = relations(conversationsTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [conversationsTable.userID],
		references: [usersTable.id]
	}),
	assistant: one(assistantsTable, {
		fields: [conversationsTable.assistant],
		references: [assistantsTable.id]
	}),
	messages: many(messagesTable)
}));

export const messageTableRelations = relations(messagesTable, ({ one, many }) => ({
	conversation: one(conversationsTable, {
		fields: [messagesTable.conversationId],
		references: [conversationsTable.id]
	}),
	media: many(messageMediaTable)
}));

export const mediaTableRelations = relations(mediaTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [mediaTable.userID],
		references: [usersTable.id]
	}),
	messages: many(messageMediaTable)
}));

export const messageMediaTableRelations = relations(messageMediaTable, ({ one, many }) => ({
	message: one(messagesTable, {
		fields: [messageMediaTable.messageId],
		references: [messagesTable.id]
	}),
	media: many(mediaTable)
}));
