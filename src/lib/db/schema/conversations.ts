import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, real, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { assistantsTable } from './assistants';
import { messagesTable } from './messages';
import { modelsTable } from './models';
import { providersTable } from './providers';
import { usersTable } from './users';
import { mediaTable } from './media';

export const conversationsTable = pgTable('conversations', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	assistantID: uuid('assistant_id').references(() => assistantsTable.id, { onDelete: 'set null' }),
	// Used for search.
	assistantName: text('assistant_name'),
	modelID: uuid('model_id').references(() => modelsTable.id, { onDelete: 'set null' }),
	modelName: text('model_name'),
	providerID: uuid('provider_id').references(() => providersTable.id, { onDelete: 'set null' }),
	providerName: text('provider_name'),

	summary: text('summary'),
	like: boolean('like').default(false),
	deleted: boolean('deleted').default(false), // XXX This is not used, remove it later.
	order: serial('order').notNull(),
	public: boolean('public').default(false),
	tokensIn: integer('tokens_in').notNull().default(0),
	tokensOut: integer('tokens_out').notNull().default(0),
	tokensInCost: real('tokens_in_cost').notNull().default(0),
	tokensOutCost: real('tokens_out_cost').notNull().default(0),

	// For o1 models.
	tokensReasoning: integer('tokens_reasoning').notNull().default(0),
	tokensReasoningCost: real('tokens_reasoning_cost').notNull().default(0),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const conversationTableRelations = relations(conversationsTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [conversationsTable.userID],
		references: [usersTable.id]
	}),
	assistant: one(assistantsTable, {
		fields: [conversationsTable.assistantID],
		references: [assistantsTable.id]
	}),
	messages: many(messagesTable),
	media: many(mediaTable),
}));
