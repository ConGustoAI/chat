import { A } from '$lib/appstate.svelte';
import dbg from 'debug';
import { assert } from './utils';
import { APIupsertFile } from '$lib/api';
const debug = dbg('app:utils/geminiUpload');

export async function doGeminiUpload(file: FileInterface, displayName: string, apiKey: string) {
	// Get the upload URL to which we will send the file
	const uploadRequestResponse = await fetch(
		`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
		{
			method: 'POST',
			headers: {
				'X-Goog-Upload-Protocol': 'resumable',
				'X-Goog-Upload-Command': 'start',
				'X-Goog-Upload-Header-Content-Length': file.size.toString(),
				'X-Goog-Upload-Header-Content-Type': file.mimeType,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				file: {
					display_name: displayName
				}
			})
		}
	);

	// The URL comes in the headers
	const googleUploadID = uploadRequestResponse.headers.get('x-guploader-uploadid');

	// Now we can upload the file
	const uploadResponse = await fetch(
		`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}&upload_id=${googleUploadID}&upload_protocol=resumable`,
		{
			method: 'POST',
			headers: {
				'Content-Type': file.mimeType,
				'Content-Length': file.size.toString(),
				'X-Goog-Upload-Command': 'upload, finalize',
				'X-Goog-Upload-Offset': '0'
			},
			body: file.file
		}
	);

	if (!uploadResponse.ok) {
		throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
	}

	// Wait for the file to be processed. Videos and PDFs take time to process.
	let result = (await uploadResponse.json()).file;
	assert(result, 'No file in upload response');
	debug('Upload result:', result);

	while (result.state === 'PROCESSING') {
		await new Promise((resolve) => setTimeout(resolve, 3000));
		const checkResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/${result.name}?key=${apiKey}`);
		result = await checkResponse.json();
		debug('Upload check result:', result);
	}

	if (result.state === 'FAILED') {
		throw new Error(`Upload failed: ${result.error.code}: ${result.error.message}`);
	}

	assert(result.state === 'ACTIVE');

	file.googleUploadFileID = result.name;
	file.googleUploadFileURI = result.uri;
	file.googleUploadExpiresAt = result.expirationTime;

	return result;
}

export async function googleUploadIfNeeded(file: FileInterface, displayName: string, apiKey: ApiKeyInterface) {
	debug('File: %o', $state.snapshot(file));
	debug('Conversation', $state.snapshot(A.conversation));
	if (!A.conversation?.assistantID) return;
	const assistant = A.assistants[A.conversation.assistantID];
	if (!assistant) return;

	debug('Assistant: %o', $state.snapshot(assistant));

	if (!assistant.modelID) return;
	debug('Model ID: %o', assistant.modelID);
	const model = A.models[assistant.modelID];
	if (!model) return;

	if (!model.providerID) return;
	const provider = A.providers[model.providerID];
	debug('Provider: %o', $state.snapshot(provider));
	if (!provider) return;

	// If not uploaded yet, or the upload expirers in less than an hour, upload it.
	if (
		provider.type === 'google' &&
		(!file.googleUploadFileID ||
			!file.googleUploadFileURI ||
			!file.googleUploadExpiresAt ||
			new Date(file.googleUploadExpiresAt) < new Date(Date.now() + 60 * 60 * 1000))
	) {
		debug(`Uploading ${$state.snapshot(file)} using ${apiKey.label}`);
		const result = await doGeminiUpload(file, displayName, apiKey.key);
		debug(`Upload complete: ${result}`);

		file.googleUploadFileID = result.name;
		file.googleUploadFileURI = result.uri;
		file.googleUploadExpiresAt = result.expirationTime;

		await APIupsertFile(file);
	}
}
