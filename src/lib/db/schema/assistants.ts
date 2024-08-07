import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { apiKeysTable } from './keys';
import { modelsTable } from './models';
import { usersTable } from './users';
import { relations } from 'drizzle-orm';
import { conversationsTable } from './conversations';

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
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

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
