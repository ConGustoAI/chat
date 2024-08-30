import { pgTable, serial } from 'drizzle-orm/pg-core';
export const seedTable = pgTable('seed', {
	seed: serial('seed').primaryKey()
});
