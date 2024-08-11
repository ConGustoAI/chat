// import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

// config({ path: '.env' });

console.log('Connecting to database: ');

const client = postgres(DATABASE_URL, { max: 5 });
export const db = drizzle(client, { schema, logger: true });

// await seed();
