import { relations } from 'drizzle-orm';
import { boolean, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { assistantsTable } from './assistants';
import { conversationsTable } from './conversations';
import { hiddenItems } from './hide';
import { mediaTable } from './media';
import { providersTable } from './providers';

export const defaultsUUID = '00000000-0000-0000-0000-000000000000';

export const usersTable = pgTable('users', {
	// There is a specual user with id 00000000-0000-0000-0000-000000000000 that holds the default models/assistants.
	id: uuid('id').primaryKey(),
	name: text('name'),
	email: text('email'),
	avatar: text('avatar'),

	github_id: text('github_id').unique(),
	google_id: text('google_id').unique(),

	admin: boolean('admin').default(false),
	hacker: boolean('hacker').default(false),
	assistant: text('assistant').default(defaultsUUID),
	lastAssistant: text('last_assistant'),
	aboutUser: text('about_user'),
	assistantInstructions: text('assistant_instructions'),
	costShow: real('cost_show').default(0.05),
	costWarn1: real('cost_warn1').default(0.5),
	costWarn2: real('cost_warn2').default(5),
	showInfo: boolean('show_info').default(false),
	showEstimate: boolean('show_estimate').default(false),
	advancedInput: boolean('advanced_input').default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const sessionsTable = pgTable('sessions', {
	id: text('id').primaryKey(),
	userID: uuid('user_id')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at').notNull()
});

export const userTableRelations = relations(usersTable, ({ many }) => ({
	providers: many(providersTable),
	assistants: many(assistantsTable),
	hiddenAssistants: many(hiddenItems),
	conversations: many(conversationsTable),
	media: many(mediaTable),
	sessions: many(sessionsTable)
}));

export const sessionsTableRelations = relations(sessionsTable, ({ one }) => ({
	user: one(usersTable,{
			fields: [sessionsTable.userID],
			references: [usersTable.id]
		}
	)
}));
