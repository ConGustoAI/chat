import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const promptsTable = pgTable('prompts', {
	id: varchar('id', { length: 16 }).primaryKey(), // The first 16 characters of text
	text: text('text').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});
