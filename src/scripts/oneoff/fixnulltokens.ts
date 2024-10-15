// This script is used to fix the null tokens/cost in the database. They are now not-null.
// It was written to be ran exactly once, to trim the summary of all conversations.
// Don't run this script again.

import dbg from 'debug';
const debug = dbg('app:db:updateinfo');

import * as schema from '$lib/db/schema';
import { config } from 'dotenv';
import { DefaultLogger, eq, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// @ts-expect-error - This is a one-off script, so the package is not installed by default.
import cliProgress from 'cli-progress';

export const run = async () => {
	const conversations = await db.query.conversationsTable.findMany();
	const messages = await db.query.messagesTable.findMany();

	const conversationBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	const messageBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

	console.log('Updating conversations...');
	conversationBar.start(conversations.length, 0);

	for (const [index, conversation] of conversations.entries()) {
		debug('conversation', conversation);

		if (!conversation.tokensIn) {
			conversation.tokensIn = 0;
		}
		if (!conversation.tokensOut) {
			conversation.tokensOut = 0;
		}
		if (!conversation.tokensInCost) {
			conversation.tokensInCost = 0;
		}
		if (!conversation.tokensOutCost) {
			conversation.tokensOutCost = 0;
		}
		if (!conversation.tokensReasoning) {
			conversation.tokensReasoning = 0;
		}
		if (!conversation.tokensReasoningCost) {
			conversation.tokensReasoningCost = 0;
		}

		await db
			.update(schema.conversationsTable)
			.set(conversation)
			.where(eq(schema.conversationsTable.id, conversation.id));

		conversationBar.update(index + 1);
	}

	conversationBar.stop();

	console.log('Updating messages...');
	messageBar.start(messages.length, 0);

	for (const [index, message] of messages.entries()) {
		debug('message', message);

		if (!message.tokensIn) {
			message.tokensIn = 0;
		}
		if (!message.tokensOut) {
			message.tokensOut = 0;
		}
		if (!message.tokensInCost) {
			message.tokensInCost = 0;
		}
		if (!message.tokensOutCost) {
			message.tokensOutCost = 0;
		}
		if (!message.tokensReasoning) {
			message.tokensReasoning = 0;
		}
		if (!message.tokensReasoningCost) {
			message.tokensReasoningCost = 0;
		}

		await db
			.update(schema.messagesTable)
			.set(message)
			.where(eq(schema.messagesTable.id, message.id));

		messageBar.update(index + 1);
	}

	messageBar.stop();
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

debug('Updating conversation and message data...');
await run();
debug('Done');
process.exit(0);
