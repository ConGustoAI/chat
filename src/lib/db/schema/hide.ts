import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './users';
import { assistantsTable } from './assistants';
import { relations } from 'drizzle-orm';

export const hiddenAssistants = pgTable('user_assistants', {
	assistantId: uuid('assistant_id')
		.references(() => assistantsTable.id, { onDelete: 'cascade' })
		.primaryKey(),
	userId: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const userHiddenAssistantsTableRelations = relations(hiddenAssistants, ({ one }) => ({
	user: one(usersTable, {
		fields: [hiddenAssistants.userId],
		references: [usersTable.id]
	}),
	assistant: one(assistantsTable, {
		fields: [hiddenAssistants.assistantId],
		references: [assistantsTable.id]
	})
}));
