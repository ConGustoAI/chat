// Script to analyze orphaned files in database and S3 bucket
// Finds files not associated with any media and S3 objects without database entries
//
// Usage:
//   bun run tsx ./src/scripts/oneoff/analyze-orphaned-files.ts [--clean-db-files] [--clean-s3-objects]
//
// Options:
//   --clean-db-files    Delete orphaned files from database
//   --clean-s3-objects  Move orphaned objects to archive/ prefix in S3

import dbg from 'debug';
const debug = dbg('app:scripts:analyze-orphaned-files');

import * as schema from '$lib/db/schema';
import { config } from 'dotenv';
import { DefaultLogger, inArray, type LogWriter } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

class MyLogWriter implements LogWriter {
	write(message: string) {
		debug(message);
	}
}

config({ path: '.env' });

// Parse command line arguments
const args = process.argv.slice(2);

function showHelp() {
	console.log(`
Usage: bun run tsx ./src/scripts/oneoff/analyze-orphaned-files.ts [OPTIONS]

Analyzes and optionally cleans up orphaned files in the database and S3 storage.

Options:
  --clean-db-files     Delete orphaned files from the database (files not linked to any media)
  --clean-s3-objects   Move orphaned S3 objects to archive/ prefix (objects without DB entries)
  --help, -h           Show this help message

Examples:
  # Analyze only (no changes)
  bun run tsx ./src/scripts/oneoff/analyze-orphaned-files.ts

  # Clean orphaned database files
  bun run tsx ./src/scripts/oneoff/analyze-orphaned-files.ts --clean-db-files

  # Clean orphaned S3 objects
  bun run tsx ./src/scripts/oneoff/analyze-orphaned-files.ts --clean-s3-objects

  # Clean both
  bun run tsx ./src/scripts/oneoff/analyze-orphaned-files.ts --clean-db-files --clean-s3-objects
`);
	process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
	showHelp();
}

const cleanDbFiles = args.includes('--clean-db-files');
const cleanS3Objects = args.includes('--clean-s3-objects');

// Validate arguments
const validArgs = ['--clean-db-files', '--clean-s3-objects', '--help', '-h'];
const invalidArgs = args.filter(arg => !validArgs.includes(arg));
if (invalidArgs.length > 0) {
	console.error(`Error: Unknown argument(s): ${invalidArgs.join(', ')}`);
	console.error('Run with --help to see available options');
	process.exit(1);
}

const logger = new DefaultLogger({ writer: new MyLogWriter() });

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

debug('Connecting to database...');
const client = postgres(process.env.DATABASE_URL, { max: 5 });
const db = drizzle(client, { schema, logger });

// Initialize S3 client
let s3: S3Client | undefined;
if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_UPLOAD_BUCKET_NAME) {
	s3 = new S3Client({
		endpoint: process.env.AWS_ENDPOINT,
		region: process.env.AWS_REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
		}
	});
	debug('S3 client initialized');
} else {
	console.warn('S3 not configured, skipping S3 analysis');
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function listAllS3Objects(prefix: string): Promise<Array<{ key: string; size: number }>> {
	if (!s3 || !process.env.AWS_UPLOAD_BUCKET_NAME) return [];

	const objects: Array<{ key: string; size: number }> = [];
	let continuationToken: string | undefined;

	do {
		const command = new ListObjectsV2Command({
			Bucket: process.env.AWS_UPLOAD_BUCKET_NAME,
			Prefix: prefix,
			ContinuationToken: continuationToken
		});

		const response = await s3.send(command);

		if (response.Contents) {
			for (const obj of response.Contents) {
				if (obj.Key && obj.Size !== undefined) {
					objects.push({ key: obj.Key, size: obj.Size });
				}
			}
		}

		continuationToken = response.NextContinuationToken;
	} while (continuationToken);

	return objects;
}

async function run() {
	console.log('='.repeat(80));
	console.log('Analyzing Database and S3 Storage');
	if (cleanDbFiles || cleanS3Objects) {
		console.log('CLEANUP MODE ENABLED:');
		if (cleanDbFiles) console.log('  - Will delete orphaned database files');
		if (cleanS3Objects) console.log('  - Will move orphaned S3 objects to archive/');
	}
	console.log('='.repeat(80));
	console.log();

	// Fetch all media
	console.log('Fetching media from database...');
	const allMedia = await db.query.mediaTable.findMany({
		with: {
			original: true,
			thumbnail: true
		}
	});
	console.log(`Found ${allMedia.length} media entries`);

	// Fetch all files
	console.log('Fetching files from database...');
	const allFiles = await db.query.fileTable.findMany();
	console.log(`Found ${allFiles.length} file entries`);

	// Calculate media stats
	const mediaFileIds = new Set<string>();
	let mediaFileCount = 0;
	let mediaTotalSize = 0;

	for (const media of allMedia) {
		if (media.originalID) {
			mediaFileIds.add(media.originalID);
			const file = allFiles.find(f => f.id === media.originalID);
			if (file) {
				mediaFileCount++;
				mediaTotalSize += file.size;
			}
		}
		if (media.thumbnailID) {
			mediaFileIds.add(media.thumbnailID);
			const file = allFiles.find(f => f.id === media.thumbnailID);
			if (file) {
				mediaFileCount++;
				mediaTotalSize += file.size;
			}
		}
	}

	// Find orphaned files (files not associated with any media)
	const orphanedFiles = allFiles.filter(file => !mediaFileIds.has(file.id));
	const orphanedFilesSize = orphanedFiles.reduce((sum, file) => sum + file.size, 0);

	// Calculate total file stats
	const totalFilesSize = allFiles.reduce((sum, file) => sum + file.size, 0);

	// Print database statistics
	console.log();
	console.log('='.repeat(80));
	console.log('DATABASE STATISTICS');
	console.log('='.repeat(80));
	console.log();

	console.log('MEDIA:');
	console.log(`  Total media entries: ${allMedia.length}`);
	console.log(`  Files referenced by media: ${mediaFileCount}`);
	console.log(`  Total size: ${formatBytes(mediaTotalSize)} (${mediaTotalSize.toLocaleString()} bytes)`);
	console.log();

	console.log('FILES:');
	console.log(`  Total file entries: ${allFiles.length}`);
	console.log(`  Total size: ${formatBytes(totalFilesSize)} (${totalFilesSize.toLocaleString()} bytes)`);
	console.log();
	console.log(`  Orphaned files (not in media): ${orphanedFiles.length}`);
	console.log(`  Orphaned size: ${formatBytes(orphanedFilesSize)} (${orphanedFilesSize.toLocaleString()} bytes)`);

	if (orphanedFiles.length > 0) {
		// Cleanup orphaned database files
		if (cleanDbFiles) {
			console.log();
			console.log(`  Deleting ${orphanedFiles.length} orphaned files from database...`);
			const orphanedFileIds = orphanedFiles.map(f => f.id);

			// Delete in batches of 100
			const batchSize = 100;
			let deleted = 0;
			for (let i = 0; i < orphanedFileIds.length; i += batchSize) {
				const batch = orphanedFileIds.slice(i, i + batchSize);
				await db.delete(schema.fileTable).where(inArray(schema.fileTable.id, batch));
				deleted += batch.length;
				console.log(`    Deleted ${deleted}/${orphanedFileIds.length} files...`);
			}
			console.log(`  ✓ Successfully deleted ${deleted} orphaned files from database`);
		}
	}

	// S3 Analysis
	if (s3) {
		console.log();
		console.log('='.repeat(80));
		console.log('S3 STORAGE STATISTICS');
		console.log('='.repeat(80));
		console.log();

		console.log('Fetching S3 objects...');
		const [uploadObjects, thumbnailObjects] = await Promise.all([
			listAllS3Objects('upload/'),
			listAllS3Objects('thumbnail/')
		]);

		const allS3Objects = [...uploadObjects, ...thumbnailObjects];
		console.log(`Found ${allS3Objects.length} S3 objects (${uploadObjects.length} uploads, ${thumbnailObjects.length} thumbnails)`);

		const totalS3Size = allS3Objects.reduce((sum, obj) => sum + obj.size, 0);

		// Extract file IDs from S3 keys
		const s3FileIds = new Set(
			allS3Objects.map(obj => {
				const parts = obj.key.split('/');
				return parts[parts.length - 1];
			})
		);

		// Find orphaned S3 objects (in S3 but not in database)
		const dbFileIds = new Set(allFiles.map(f => f.id));
		const orphanedS3Objects = allS3Objects.filter(obj => {
			const fileId = obj.key.split('/').pop();
			return fileId && !dbFileIds.has(fileId);
		});
		const orphanedS3Size = orphanedS3Objects.reduce((sum, obj) => sum + obj.size, 0);

		// Find missing S3 objects (in database but not in S3)
		const missingS3Files = allFiles.filter(file => !s3FileIds.has(file.id));
		const missingS3Size = missingS3Files.reduce((sum, file) => sum + file.size, 0);

		console.log();
		console.log('S3 OBJECTS:');
		console.log(`  Total S3 objects: ${allS3Objects.length}`);
		console.log(`  Total size: ${formatBytes(totalS3Size)} (${totalS3Size.toLocaleString()} bytes)`);
		console.log();
		console.log(`  Orphaned S3 objects (not in DB): ${orphanedS3Objects.length}`);
		console.log(`  Orphaned size: ${formatBytes(orphanedS3Size)} (${orphanedS3Size.toLocaleString()} bytes)`);

		if (orphanedS3Objects.length > 0) {
			// Cleanup orphaned S3 objects by moving to archive
			if (cleanS3Objects) {
				console.log();
				console.log(`  Moving ${orphanedS3Objects.length} orphaned objects to archive/...`);
				let moved = 0;
				let failed = 0;

				for (const obj of orphanedS3Objects) {
					try {
						const archiveKey = `archive/${obj.key}`;

						// Copy to archive
						const copyCommand = new CopyObjectCommand({
							Bucket: process.env.AWS_UPLOAD_BUCKET_NAME!,
							CopySource: `${process.env.AWS_UPLOAD_BUCKET_NAME}/${obj.key}`,
							Key: archiveKey
						});
						await s3!.send(copyCommand);

						// Delete original
						const deleteCommand = new DeleteObjectCommand({
							Bucket: process.env.AWS_UPLOAD_BUCKET_NAME!,
							Key: obj.key
						});
						await s3!.send(deleteCommand);

						moved++;
						if (moved % 50 === 0) {
							console.log(`    Moved ${moved}/${orphanedS3Objects.length} objects...`);
						}
					} catch (error) {
						failed++;
						console.error(`    Failed to move ${obj.key}: ${error}`);
					}
				}
				console.log(`  ✓ Successfully moved ${moved} orphaned S3 objects to archive/`);
				if (failed > 0) {
					console.log(`  ✗ Failed to move ${failed} objects`);
				}
			}
		}

		console.log();
		console.log(`  Missing S3 objects (in DB but not in S3): ${missingS3Files.length}`);
		console.log(`  Expected size: ${formatBytes(missingS3Size)} (${missingS3Size.toLocaleString()} bytes)`);
	}

	console.log();
	console.log('='.repeat(80));
	console.log('Analysis complete');
	console.log('='.repeat(80));
}

debug('Starting analysis...');
await run();
debug('Done');
process.exit(0);
