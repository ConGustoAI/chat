
// This is a script to update the conversation table with the assistant name, model name, provider name, and provider ID.
// It was written to be ran exactly once, to add missing information to the conversation table.
// Don't run this script again.

import dbg from 'debug';
const debug = dbg('app:db:updateinfo');

import * as schema from '$lib/db/schema';
import { config } from 'dotenv';
import { DefaultLogger, eq, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const run = async () => {
	const models = await db.query.modelsTable.findMany({
		with: {
			provider: true
		}
	});
	const assistants = await db.query.assistantsTable.findMany();
	const conversations = await db.query.conversationsTable.findMany();

	for (const conversation of conversations) {
		debug('conversation', conversation);
		const a = conversation.assistant;
		if (a) {
			const assistant = assistants.find((assistant) => assistant.id === a);
			if (assistant) {
				conversation.assistantName = assistant.name;

				const m = assistant.modelID;
				if (m) {
					const model = models.find((model) => model.id === m);
					if (model) {
						conversation.modelName = model.name;
						conversation.model = model.id;
						conversation.provider = model.provider.id;
						conversation.providerName = model.provider.name;
					}
				}
			}
		}

		await db
			.update(schema.conversationsTable)
			.set(conversation)
			.where(eq(schema.conversationsTable.id, conversation.id));
	}
};

config({ path: '.env' });

class MyLogWriter implements LogWriter {
	write(message: string) {
		debug(message);
	}
}
const logger = new DefaultLogger({ writer: new MyLogWriter() });

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

debug('Connecting to database...');
const client = postgres(process.env.DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema, logger });

debug('Updating conversation into...');
await run();
debug('Done');
process.exit(0);
