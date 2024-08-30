import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
	schema: './src/lib/db/schema/',
	schemaFilter: ['public'],
	out: './migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	},
	verbose: true,
	strict: true
});
