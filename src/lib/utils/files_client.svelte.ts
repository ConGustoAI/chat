import dbg from 'debug';
import { APIupsertFile } from '../api';
import { assert } from './utils';
const debug = dbg('app:lib:files-client');

export async function putFile(file: FileInterface) {
	if (!file.file) throw new Error('No .file provided');
	if (!file.uploadURL) throw new Error('No upload URL provided');

	file.status = 'progress';
	file.uploadProgress = 0;

	const xhr = new XMLHttpRequest();
	xhr.open('PUT', file.uploadURL, true);
	xhr.setRequestHeader('Content-Type', file.mimeType);

	xhr.upload.onprogress = (event) => {
		debug('upload progress', event);
		if (event.lengthComputable) {
			file.uploadProgress = Math.round((event.loaded / event.total) * 100);
		}
	};

	return await new Promise<FileInterface>((resolve, reject) => {
		xhr.onload = () => {
			debug('upload complete', xhr.status);
			if (xhr.status >= 200 && xhr.status < 300) {
				file.status = 'ok';
				resolve(file);
			} else {
				file.status = 'failed';
				file.uploadError = `Upload failed with status ${xhr.status}`;
				reject(new Error(file.uploadError));
			}
		};

		xhr.onerror = () => {
			file.status = 'failed';
			file.uploadError = 'Network error occurred during upload';
			reject(new Error(file.uploadError));
		};

		xhr.send(file.file);
	});
}

export async function uploadFile(file: FileInterface) {
	if (!file.file) throw new Error('File not found');
	debug('uploadFile', $state.snapshot(file));

	file.status = 'progress';
	file.uploadProgress = 0;
	Object.assign(file, await APIupsertFile(file, true));
	// file = { ...file, ...(await APIupsertFile(file, true)) };

	assert(file.uploadURL, 'No upload URL returned');
	debug('uploadFile insertion: ', $state.snapshot(file));

	const res = await putFile(file);
	debug('uploadFile putFile: ', $state.snapshot(res));
	Object.assign(file, res);
	// debug('uploadFile putFile assign: ', $state.snapshot(file));

	// Update status
	Object.assign(file, await APIupsertFile(file, true));
	// file = { ...file, ...(await APIupsertFile(file, true)) };
	debug('uploadFile finished', $state.snapshot(file));
	return file;
}
