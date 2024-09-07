import { DATABASE_URL } from '$env/static/private';
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

debug('Connecting to database');
const client = postgres(DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema, logger });

