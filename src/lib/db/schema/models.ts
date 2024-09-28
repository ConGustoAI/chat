import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { assistantsTable } from './assistants';
import { providersTable } from './providers';
import { usersTable } from './users';


export const modelsTable = pgTable('models', {
	id: uuid('id').defaultRandom().primaryKey(),
	userID: uuid('user_id')
		.references(() => usersTable.id, { onDelete: 'cascade' })
		.notNull(),
	displayName: text('display_name').notNull(),
	name: text('name').notNull(),
	streaming: boolean('streaming').default(true),
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
	outputContext: integer('output_context').notNull().default(4096),
	inputCost: real('input_cost').default(0.0), // Cost in dollars per 1,000,000 tokens
	outputCost: real('output_cost').default(0.0),
	maxTemp: real('max_temp').notNull().default(2.0),
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
	assistants: many(assistantsTable),
	user: one(usersTable, {
		fields: [modelsTable.userID],
		references: [usersTable.id]
	})
}));
