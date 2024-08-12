import { relations } from 'drizzle-orm';
import { boolean, pgSchema, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { providersTable } from './providers';
import { assistantsTable } from './assistants';
import { conversationsTable } from './conversations';
import { mediaTable } from './media';
import { hiddenAssistants } from './hide';

const authSchema = pgSchema('auth');
export const AuthUsersTable = authSchema.table('users', {
	id: uuid('id').primaryKey()
});

export const defaultsUUID = '00000000-0000-0000-0000-000000000000';

export const usersTable = pgTable('users', {
	id: uuid('id').primaryKey(),
	name: text('name'),
	email: text('email'),
	avatar: text('avatar'),
	admin: boolean('admin').default(false),
	hacker: boolean('hacker').default(false),
	assistant: text('assistant'),
	aboutUser: text('about_user'),
	assistantInstructions: text('assistant_instructions'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const userTableRelations = relations(usersTable, ({ many }) => ({
	providers: many(providersTable),
	assistants: many(assistantsTable),
	hiddenAssistants: many(hiddenAssistants),
	conversations: many(conversationsTable),
	media: many(mediaTable)
}));
