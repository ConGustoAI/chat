import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const fileTable = pgTable('file', {
	id: uuid('id').defaultRandom().primaryKey(),
	// mediaID: uuid('media_id')
	// 	.references(() => mediaTable.id, { onDelete: 'cascade' })
	// 	.notNull(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),

	fileName: text('file_name').notNull(),
	size: integer('size').notNull(),
	mimeType: text('mime_type').notNull(),
	hasPreview: boolean('preview').default(false),
	previewSize: integer('preview_size'),
	previewMimeType: text('preview_mime_type'),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updateAt: timestamp('update_at').notNull().defaultNow()
});

export const imageFileTable = pgTable('file_image', {
	id: uuid('id').primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),

	fileID: uuid('file_id')
		.references(() => fileTable.id, { onDelete: 'cascade' })
		.notNull(),

	// For images
	width: integer('width').notNull(),
	height: integer('height').notNull(),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updateAt: timestamp('update_at').notNull().defaultNow()
});

export const fileTableRelations = relations(fileTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [fileTable.userID],
		references: [usersTable.id]
	})
}));

export const imageFileTableRelations = relations(imageFileTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [imageFileTable.userID],
		references: [usersTable.id]
	}),
	file: one(fileTable, {
		fields: [imageFileTable.fileID],
		references: [fileTable.id]
	})
}));
