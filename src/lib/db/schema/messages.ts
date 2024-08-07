import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { assistantsTable } from './assistants';
import { conversationsTable } from './conversations';
import { relations } from 'drizzle-orm';
import { messageMediaTable } from './media';

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const messagesTable = pgTable('messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	conversationId: uuid('conversation_id')
		.references(() => conversationsTable.id, { onDelete: 'cascade' })
		.notNull(),
	assistant: uuid('assistant_id').references(() => assistantsTable.id, { onDelete: 'set null' }),
	role: messageRoleEnum('role').notNull(),
	text: text('text').notNull(),
	usageIn: integer('usage_in').default(0),
	usageOut: integer('usage_out').default(0),
	requestID: text('request_id'),
	finishReason: text('finish_reason'),
	deleted: boolean('deleted').default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const messageTableRelations = relations(messagesTable, ({ one, many }) => ({
	conversation: one(conversationsTable, {
		fields: [messagesTable.conversationId],
		references: [conversationsTable.id]
	}),
	media: many(messageMediaTable)
}));
