import { boolean, integer, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { providersTable } from './providers';
import { relations } from 'drizzle-orm';
import { assistantsTable } from './assistants';


export const modelsTable = pgTable('models', {
	id: uuid('id').defaultRandom().primaryKey(),
	displayName: text('display_name').notNull(),
	name: text('name').notNull(),
	audio: boolean('audio').notNull().default(false),
	images: boolean('images').notNull().default(false),
	prefill: boolean('prefill').notNull().default(false),
	maxImages: integer('max_images'),
	imageTokens: real('image_tokens'), // tokens per pixel
	maxAudio: integer('max_audio'),
	audioTokens: real('audio_tokens'), // tokens per second
	video: boolean('video').notNull().default(false),
	maxVideo: integer('max_video'),
	videoTokens: real('video_tokens'), // tokens per second
	inputContext: integer('input_context').notNull().default(8192),
	providerID: uuid('provider')
		.notNull()
		.references(() => providersTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});



export const modelsTableRelations = relations(modelsTable, ({ one, many }) => ({
	provider: one(providersTable, {
		fields: [modelsTable.providerID],
		references: [providersTable.id]
	}),
	assistants: many(assistantsTable)
}));


