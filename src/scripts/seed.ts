import { defaultsUUID, seedTable, usersTable } from '$lib/db/schema';
import dbg from 'debug';
const debug = dbg('app:db:seed');

import * as schema from '$lib/db/schema';
import { config } from 'dotenv';
import { DefaultLogger, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { seedModels, seedProviders } from './seed/providers';
import { seedAssistants } from './seed/assistants';
import { seedConversations } from './seed/conversations';

export const seed = async () => {
	await db.transaction(async (tx) => {
		const select = await tx.query.seedTable.findFirst({ orderBy: (table, { desc }) => desc(table.seed) });
		debug(select);

		if ((select?.seed ?? 0) < 2) {
			await seedDefaultUser(tx);
			await seedProviders(tx);
			await seedModels(tx);
			await seedAssistants(tx);
			await seedConversations(tx);
			await tx
				.insert(seedTable)
				.values([{ seed: 2 }])
				.onConflictDoNothing();
		}
	});
};

const seedDefaultUser = async (tx: typeof db) => {
	await tx
		.insert(usersTable)
		.values([{ id: defaultsUUID, name: 'Default User' }])
		.onConflictDoNothing();
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

debug('Seeding the database...');
await seed();
debug('Seeding complete');
process.exit(0);
