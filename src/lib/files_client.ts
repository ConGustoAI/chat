
import dbg from 'debug';
const debug = dbg('app:lib:files-client');


export async function putFile(file: FileInterface) {
	if (!file.file) throw new Error('No .file provided');
	if (!file.uploadURL) throw new Error('No upload URL provided');

	file.status = 'progress';
	file.uploadProgress = 0;

	const xhr = new XMLHttpRequest();
	xhr.open('PUT', file.uploadURL, true);
	xhr.setRequestHeader('Content-Type', file.mimeType);
	xhr.setRequestHeader('Content-Length', file.size.toString());

	xhr.upload.onprogress = (event) => {
		debug('upload progress', event);
		if (event.lengthComputable) {
			file.uploadProgress = Math.round((event.loaded / event.total) * 100);
		}
	};

	return new Promise<FileInterface>((resolve, reject) => {
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
