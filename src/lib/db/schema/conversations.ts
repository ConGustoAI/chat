import { boolean, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { assistantsTable } from './assistants';
import { usersTable } from './users';
import { relations } from 'drizzle-orm';
import { messagesTable } from './messages';

export const conversationsTable = pgTable('conversations', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	assistant: uuid('assistant_id').references(() => assistantsTable.id, { onDelete: 'set null' }),
	summary: text('summary'),
	like: boolean('like').default(false),
	deleted: boolean('deleted').default(false),
	order: serial('order').notNull(),
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
		fields: [conversationsTable.assistant],
		references: [assistantsTable.id]
	}),
	messages: many(messagesTable)
}));
