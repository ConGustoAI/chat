import { relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { apiKeysTable } from './keys';
import { modelsTable } from './models';
import { usersTable } from './users';

export const providerTypes = pgEnum('provider_types', ['openai', 'anthropic', 'google']);

export const providersTable = pgTable('providers', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	type: providerTypes('type').notNull(),
	// Does the OpenAI provider support usage stats when streaming?
	openAIStreamUsage: boolean('openai_stream_usage').default(true),
	baseURL: text('base_url').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const providerTableRelations = relations(providersTable, ({ one, many }) => ({
	users: one(usersTable, {
		fields: [providersTable.userID],
		references: [usersTable.id]
	}),
	apiKeys: many(apiKeysTable),
	models: many(modelsTable)
}));
