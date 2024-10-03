import { env } from '$env/dynamic/private';
import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/postgres-js';

import postgres from 'postgres';
import * as schema from './schema';

import dbg from 'debug';
const debug = dbg('app:db');

class MyLogWriter implements LogWriter {
	write(message: string) {
		debug(message);
	}
}
const logger = new DefaultLogger({ writer: new MyLogWriter() });

if (!env.DATABASE_URL) {
	debug('DATABASE_URL not set');
	throw new Error('DATABASE_URL not set');
}

debug('Connecting to database');
const client = postgres(env.DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema, logger });
