import { config } from 'dotenv';
import { DefaultLogger, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '$lib/db/schema';

import dbg from 'debug';
const debug = dbg('app:db:migrations');
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

debug('Running migrations...');
await migrate(db, { migrationsFolder: './migrations' });
debug('Migrations complete');
process.exit(0);

