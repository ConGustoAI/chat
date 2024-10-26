import { relations } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, real, serial, text, timestamp, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { conversationsTable } from './conversations';
import { fileTable } from './file';
import { usersTable } from './users';

export const mediaTypes = pgEnum('media_types', ['image', 'audio', 'video', 'text', 'pdf']);

export const mediaTable = pgTable('media', {
	id: uuid('id').defaultRandom().primaryKey(),
	order: serial('order').notNull(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	conversationID: uuid('conversation_id').references(() => conversationsTable.id, { onDelete: 'set null' }),
	repeat: boolean('repeat').default(true),

	title: text('title').notNull(),
	filename: text('filename').notNull(),
	type: mediaTypes('type').notNull(),

	PDFAsImages: boolean('pdf_as_images'),
	PDFAsImagesDPI: integer('pdf_as_images_dpi'),
	PDFAsDocument: boolean('pdf_as_document'),
	PDFAsFile: boolean('pdf_as_file'),

	videoAsImages: boolean('video_as_images'),
	videoAsFile: boolean('video_as_file'),

	// For PDF and video that have been converted to images, we can skip pages/frames.
	imagesSkip: integer('images_skip').array(),

	originalWidth: integer('width'),
	originalHeight: integer('height'),
	originalDuration: real('duration'),

	resizedWidth: integer('resized_width'),
	resizedHeight: integer('resized_height'),

	// // For images and videos
	// // Crop in %, stays constant across resizes.
	cropStartX: real('crop_start_x'),
	cropStartY: real('crop_start_y'),
	cropEndX: real('crop_end_x'),
	cropEndY: real('crop_end_y'),

	// // For video and audio
	trimStart: real('duration_start'),
	trimEnd: real('duration_end'),

	originalID: uuid('original_id').references((): AnyPgColumn => fileTable.id, { onDelete: 'set null' }),

	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const mediaTableRelations = relations(mediaTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [mediaTable.userID],
		references: [usersTable.id]
	}),
	conversation: one(conversationsTable, {
		fields: [mediaTable.conversationID],
		references: [conversationsTable.id]
	}),
	original: one(fileTable, {
		fields: [mediaTable.originalID],
		references: [fileTable.id]
	})
}));
