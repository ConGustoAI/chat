import { relations } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

// 'deleted' is not used in the database and unly returned by the API after a files has been deleted.
export const uploadStatus = pgEnum('upload_status', ['progress', 'ok', 'failed', 'deleted']);

export const fileTable = pgTable('file', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),

	size: integer('size').notNull(),
	mimeType: text('mime_type').notNull(),
	isThumbnail: boolean('is_thumbnail'),

	status: uploadStatus('status'),

	googleUploadFileID: text('google_file_id'), // The file ID returned by google
	googleUploadFileURI: text('google_uri'), // The upload ID returned by google
	googleUploadExpiresAt: text('google_expires_at'),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('update_at').notNull().defaultNow()
});

export const fileTableRelations = relations(fileTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [fileTable.userID],
		references: [usersTable.id]
	})
}));
