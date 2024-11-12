import dbg from 'debug';
const debug = dbg('app:scripts:updateinfo');

import * as schema from '$lib/db/schema';
import { config } from 'dotenv';
import { DefaultLogger, eq, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Command } from 'commander';
import { defaultsUUID } from '$lib/db/schema';

async function run(conversationID: string, newUserID: string = defaultsUUID) {

    const conversation = await db.query.conversationsTable.findFirst({
        where: eq(schema.conversationsTable.id, conversationID)
    });

    if (!conversation) {
        console.error(`Conversation ${conversationID} not found`);
        process.exit(1);
    }

    const conversationMessages = await db.query.messagesTable.findMany({
        where: eq(schema.messagesTable.conversationID, conversationID)
    });

    const conversationMedia = await db.query.mediaTable.findMany({
        where: eq(schema.mediaTable.conversationID, conversationID)
    });

    const mediaOrignalFiles = conversationMedia.map(m => m.originalID);

    debug(`Found ${conversationMessages.length} messages and ${conversationMedia.length} media with ${mediaOrignalFiles.length} files for conversation ${conversationID}`);

    debug(`Changing user of conversation ${conversationID} from ${conversation.userID} to ${newUserID}`);

    await db.transaction(async (tx) => {
        // Update conversation
        await tx
            .update(schema.conversationsTable)
            .set({ userID: newUserID })
            .where(eq(schema.conversationsTable.id, conversationID));

        // Update messages
        for (const message of conversationMessages) {
            await tx
                .update(schema.messagesTable)
                .set({ userID: newUserID })
                .where(eq(schema.messagesTable.id, message.id));
        }

        // Update media
        for (const media of conversationMedia) {
            await tx
                .update(schema.mediaTable)
                .set({ userID: newUserID })
                .where(eq(schema.mediaTable.id, media.id));
        }

        // Update media original files
        for (const originalID of mediaOrignalFiles) {
            await tx
                .update(schema.fileTable)
                .set({ userID: newUserID })
                .where(eq(schema.fileTable.id, originalID));
        }
    });

    debug(`User changed for conversation ${conversationID}`);

}

// Replace the manual argument parsing with this:
const program = new Command();

program
  .name('change-user')
  .description('Change the user ID for a conversation')
  .requiredOption('--conversation <id>', 'conversation ID to modify')
  .option('--user <id>', 'new user ID', defaultsUUID);

program.parse();

const { conversation: conversationID, user: userID } = program.opts();

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
await run(conversationID, userID);
debug('Done');
process.exit(0);


