import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const promptsTable = pgTable('prompts', {
	id: varchar('id', { length: 16 }).primaryKey(), // The first 16 characters of text
	userID: uuid('user_id').references(() => usersTable.id, { onDelete: 'set null' }), // The first user to create the prompt
	text: text('text').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});
