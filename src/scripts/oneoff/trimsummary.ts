
// This is a script to trim the conversation summary to 128 characters.
// It was written to be ran exactly once, to trim the summary of all conversations.
// Don't run this script again.

import dbg from 'debug';
const debug = dbg('app:db:updateinfo');

import * as schema from '$lib/db/schema';
import { config } from 'dotenv';
import { DefaultLogger, eq, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { trimLineLength } from '$lib/utils';

export const run = async () => {
	const conversations = await db.query.conversationsTable.findMany();

	for (const conversation of conversations) {
		debug('conversation', conversation);
		
		if (conversation.summary && conversation.summary.length > 128) {
			conversation.summary = trimLineLength(conversation.summary, 128);
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
