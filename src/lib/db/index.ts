import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';
import { env } from '$env/dynamic/private'

import dbg from 'debug';
import { seed } from './seed';
const debug = dbg('app:db');

class MyLogWriter implements LogWriter {
	write(message: string) {
		debug(message);
	}
}
const logger = new DefaultLogger({ writer: new MyLogWriter() });

debug('Connecting to database');
const client = postgres(DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema, logger });

debug('Running migrations');
if (!env.SKIP_MIGRATIONS) await migrate(db, { migrationsFolder: './migrations' });
if (!env.SKIP_SEED) await seed();
