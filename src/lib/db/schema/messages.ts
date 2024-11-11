import { relations, sql } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, real, serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { assistantsTable } from './assistants';
import { conversationsTable } from './conversations';
import { mediaTable } from './media';
import { modelsTable } from './models';
import { promptsTable } from './prompts';
import { usersTable } from './users';

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const messagesTable = pgTable('messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	order: serial('order'),
	conversationID: uuid('conversation_id')
		.references(() => conversationsTable.id, { onDelete: 'cascade' })
		.notNull(),
	assistantID: uuid('assistant_id').references(() => assistantsTable.id, { onDelete: 'set null' }),
	assistantName: text('assistant_name'),
	modelID: uuid('model_id').references(() => modelsTable.id, { onDelete: 'set null' }),
	modelName: text('model_name'),
	promptID: varchar('prompt', { length: 16 }).references(() => promptsTable.id, { onDelete: 'set null' }),
	temperature: real('temperature'),
	topP: real('top_p'),
	topK: integer('top_k'),
	role: messageRoleEnum('role').notNull(),
	text: text('text').notNull(),
	tokensIn: integer('tokens_in').notNull().default(0),
	tokensOut: integer('tokens_out').notNull().default(0),
	tokensInCost: real('tokens_in_cost').notNull().default(0),
	tokensOutCost: real('tokens_out_cost').notNull().default(0),
	// For o1 models.
	tokensReasoning: integer('tokens_reasoning').notNull().default(0),
	tokensReasoningCost: real('tokens_reasoning_cost').notNull().default(0),

	requestID: text('request_id'),
	finishReason: text('finish_reason'),
	deleted: boolean('deleted').default(false),
	mediaIDs: uuid('media_id')
		.references(() => mediaTable.id, { onDelete: 'set null' })
		.array()
		.default(sql`ARRAY[]::uuid[]`),


	messagesSent: text('messages_sent'),
	result: text('result'),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const messageTableRelations = relations(messagesTable, ({ one }) => ({
	conversation: one(conversationsTable, {
		fields: [messagesTable.conversationID],
		references: [conversationsTable.id]
	}),

	user: one(usersTable, {
		fields: [messagesTable.userID],
		references: [usersTable.id]
	}),
	assistant: one(assistantsTable, {
		fields: [messagesTable.assistantID],
		references: [assistantsTable.id]
	}),
	model: one(modelsTable, {
		fields: [messagesTable.modelID],
		references: [modelsTable.id]
	}),
	prompt: one(promptsTable, {
		fields: [messagesTable.promptID],
		references: [promptsTable.id]
	})
}));
