// src/routes/upload/+server.js
import { DBdeleteFile, DBupsertFile } from '$lib/db/utils';
import {
	DeleteObjectCommand,
	PutObjectCommand,
	type PutObjectCommandInput,
	type PutObjectCommandOutput
} from '@aws-sdk/client-s3';
import { env as envPrivate } from '$env/dynamic/private';
import { env as envPublic } from '$env/dynamic/public';

import { error, json } from '@sveltejs/kit';
import { PassThrough } from 'stream';
import { Readable, Writable } from 'stream';
import { ReadableStream } from 'stream/web';

import Busboy from 'busboy';

import { s3 } from '$lib/utils/files_server';

import dbg from 'debug';
const debug = dbg('app:upload');

// export async function POST({ request, locals: { dbUser }, params }) {
// 	if (!dbUser) return json({ error: 'Unauthorized' }, { status: 401 });

// 	const reader = Readable.fromWeb(request.body as ReadableStream);

// // 	reader.on('data', (chunk) => {
// // 		debug('Received chunk:', chunk);
// // 	});

// // 	return new Promise((resolve, reject) => {
// // 		const writer = new Writable({
// // 			write(chunk, encoding, callback) {
// // 				debug('Writing chunk:', chunk);
// // 				callback();
// // 			}
// // 		});

// // 		reader.pipe(writer);

// // 		reader.on('end', () => {
// // 			debug('Reader ended');
// // 			resolve(json({ success: true }));
// // 		});

// // 		reader.on('error', (err) => {
// // 			debug('Reader error:', err);
// // 			reject(json({ error: 'Failed to read file' }, { status: 500 }));
// // 		});
// // 	});
// // }

// // async function ttt({ request, locals: { dbUser } }) {
// 	// Set limits for file size and other constraints
// 	const busboy = Busboy({
// 		headers: Object.fromEntries(request.headers), // Convert Headers to plain object
// 		limits: {
// 			fileSize: Number(envPublic.PUBLIC_MAX_UPLOAD_SIZE_MB) * 1024 * 1024, // Max file size in bytes
// 			files: 2, // Max number of files (file + preview)
// 			fields: 10 // Max number of non-file fields
// 		}
// 	});

// 	let fileData: { file: PassThrough; filename: string; mimeType: string; size: number } | null = null;
// 	let previewData: { file: PassThrough; filename: string; mimeType: string; size: number } | null = null;
// 	let fileId: string | undefined;
// 	let filename: string | undefined;
// 	let fileTooLarge = false;

// 	return new Promise((resolve, reject) => {
// 		busboy.on('file', (fieldname, file, info) => {

// 			const { filename: fileName, mimeType } = info;
// 			debug('Uploading file:', fileName, mimeType);
// 			const fileStream = new PassThrough();
// 			file.pipe(fileStream);

// 			if (fieldname === 'file') {
// 				fileData = { file: fileStream, filename: fileName, mimeType, size: 0 };
// 			} else if (fieldname === 'preview') {
// 				previewData = { file: fileStream, filename: fileName, mimeType, size: 0 };
// 			}

// 			file.on('data', (data) => {
// 				debug('Received file data:', data.length);
// 				if (fieldname === 'file') fileData!.size += data.length;
// 				if (fieldname === 'preview') previewData!.size += data.length;
// 			});

// 			// Handle file size limit during streaming
// 			file.on('limit', () => {
// 				debug('File size limit reached');
// 				fileTooLarge = true;
// 				file.resume(); // Continue reading to avoid hanging
// 			});

// 			file.on('error', (err) => {
// 				debug('File stream error:', err);
// 				reject(json({ error: 'File stream error' }, { status: 500 }));
// 			});
// 		});

// 		busboy.on('field', (fieldname, val) => {
// 			debug('Received field:', fieldname, val);
// 			if (fieldname === 'id') fileId = val;
// 			if (fieldname === 'filename') filename = val;
// 		});

// 		busboy.on('finish', async () => {
// 			debug('Busboy finished');
// 			try {
// 				if (fileTooLarge) {
// 					return reject(json({ error: 'File too large' }, { status: 400 }));
// 				}

// 				if (!fileData || !filename) {
// 					return reject(json({ error: 'No file or filename provided' }, { status: 400 }));
// 				}

// 				// Create file metadata
// 				const newFile: FileInterface = {
// 					id: fileId,
// 					userID: dbUser.id,
// 					fileName: filename,
// 					mimeType: fileData.mimeType,
// 					size: fileData.size,
// 					hasPreview: !!previewData,
// 					previewSize: previewData?.size,
// 					previewMimeType: previewData?.mimeType,
// 					status: 'progress'
// 				};

// 				// Insert file metadata into the database
// 				const insertedFile = await DBupsertFile({ dbUser, file: newFile });
// 				newFile.id = insertedFile.id;

// 				// Upload file and preview to S3
// 				const [fileRes, previewRes] = await Promise.all([
// 					uploadFileToS3(fileData.file, `upload/${insertedFile.id}`, fileData.mimeType, fileData.size),
// 					previewData
// 						? uploadFileToS3(
// 								previewData.file,
// 								`upload/${insertedFile.id}-preview`,
// 								previewData.mimeType,
// 								previewData.size
// 							)
// 						: Promise.resolve(null)
// 				]);

// 				if (!fileRes || (previewData && !previewRes)) {
// 					newFile.status = 'failed';
// 					await DBupsertFile({ dbUser, file: newFile });
// 					return reject(json({ error: 'Failed to upload file to S3' }, { status: 500 }));
// 				}

// 				// Update file status to 'ok'
// 				newFile.status = 'ok';
// 				const updatedFile = await DBupsertFile({ dbUser, file: newFile });

// 				resolve(json(updatedFile));
// 			} catch (err) {
// 				debug('Error during file upload:', err);
// 				reject(json({ error: 'Failed to upload file' }, { status: 500 }));
// 			}
// 		});

// 		if (!request.body) {
// 			return reject(json({ error: 'No file provided' }, { status: 400 }));
// 		}
// 		debug('Piping request body to busboy');
// 		reader.pipe(busboy);
// 	});
// }
