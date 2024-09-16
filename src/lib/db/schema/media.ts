import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { messagesTable } from './messages';
import { usersTable } from './users';
import { relations } from 'drizzle-orm';

export const mediaTypes = pgEnum('media_types', ['image', 'audio', 'video']);

export const mediaTable = pgTable('media', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	title: text('title'),
	type: mediaTypes('type').notNull(),
	mimeType: text('mime_type'),
	filename: text('filename').notNull(),
	filesize: integer('filesize').notNull(),
	width: integer('image_width').default(0),
	height: integer('image_height').default(0),
	duration: integer('duration').default(0),
	repeat: boolean('repeat').default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const messageMediaTable = pgTable('message_media', {
	messageId: uuid('message_id')
		.references(() => messagesTable.id, { onDelete: 'cascade' })
		.notNull(),
	mediaId: uuid('media_id')
		.references(() => mediaTable.id, { onDelete: 'cascade' })
		.notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow().notNull().defaultNow()
});

export const mediaTableRelations = relations(mediaTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [mediaTable.userID],
		references: [usersTable.id]
	}),
	messages: many(messageMediaTable)
}));

export const messageMediaTableRelations = relations(messageMediaTable, ({ one, many }) => ({
	message: one(messagesTable, {
		fields: [messageMediaTable.messageId],
		references: [messagesTable.id]
	}),
	media: many(mediaTable)
}));
