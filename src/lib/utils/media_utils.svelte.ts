import { APIupsertConversation, APIupsertFile, APIupsertMedia, fetchFileByURL } from '$lib/api';
import { A } from '$lib/appstate.svelte';
import { uploadFile } from '$lib/utils/files_client.svelte';
import dbg from 'debug';
import { typeFromFile } from './filetype';
import { assert } from './utils';
import { pdfThumbnail } from './pdf';

const debug = dbg('app:lib:media_utils');

// Resize image
export async function resizeImage(
	file: FileInterface,
	width: number,
	height: number,
	pad: boolean = false
): Promise<FileInterface> {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d', { alpha: true });
	if (!context) throw new Error('Canvas context not found');
	if (!file.file) throw new Error('File file not found');

	A.mediaProcessing = true;
	debug('resizeImage', $state.snapshot(file), width, height);
	try {
		const image = new Image();
		const p = new Promise((resolve, reject) => {
			image.onload = resolve;
			image.onerror = reject;
			image.onabort = () => reject(new Error('Image loading aborted'));
		});
		image.src = URL.createObjectURL(file.file);
		await p;
		debug('image', image);

		canvas.width = width;
		canvas.height = height;

		context.clearRect(0, 0, width, height);
		if (pad) {
			// Clear the canvas with a transparent background

			const aspectRatio = image.width / image.height;
			let drawWidth = width;
			let drawHeight = height;
			let offsetX = 0;
			let offsetY = 0;

			if (width / height > aspectRatio) {
				drawWidth = height * aspectRatio;
				offsetX = (width - drawWidth) / 2;
			} else {
				drawHeight = width / aspectRatio;
				offsetY = (height - drawHeight) / 2;
			}

			[drawWidth, drawHeight, offsetX, offsetY] = [drawWidth, drawHeight, offsetX, offsetY].map(Math.round);

			context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
		} else {
			context.drawImage(image, 0, 0, width, height);
		}

		debug('canvas', canvas);

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.mimeType));
		if (!blob) throw new Error('Blob is null');
		const resizedFile = new File([blob], 'resized');
		debug('blob', blob);

		return {
			userID: A.dbUser?.id ?? 'anon',
			url: URL.createObjectURL(blob),
			mimeType: blob.type,
			size: blob.size,
			file: resizedFile
		};
	} finally {
		A.mediaProcessing = false;
	}
}

export async function syncFileURL(file: FileInterface, filename: string = 'file') {
	debug('syncFileURL', $state.snapshot(file));

	assert(file.file || file.url, 'FileInterface must have a file or URL');

	if (file.url && !file.file) {
		// We replace the original URL with a blob URL to avoid re-fetching the file.
		file.file = await fetchFileByURL(file.url, filename);
		URL.revokeObjectURL(file.url);
		file.url = URL.createObjectURL(file.file);
	}

	if (!file.url && file.file) {
		file.url = URL.createObjectURL(file.file);
	}
}

export async function syncMedia(media: MediaInterface) {
	if (!media.original) throw new Error('MediaInterface must have an original file');

	A.mediaProcessing = true;
	try {
		if (media.original) await syncFileURL(media.original, media.filename);
		if (media.thumbnail) await syncFileURL(media.thumbnail, media.filename);

		// This will only run once, when the new media is processed for the first time.
		if (media.type === 'image' && (!media.originalWidth || !media.originalHeight) && media.original?.file) {
			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				img.onload = () => {
					media.originalWidth = img.naturalWidth;
					media.originalHeight = img.naturalHeight;
					// URL.revokeObjectURL(img.src);
					resolve();
				};
				img.onerror = (error) => {
					// URL.revokeObjectURL(img.src);
					reject(new Error('Failed to load image: ' + error));
				};
				if (media.original?.file) {
					img.src = URL.createObjectURL(media.original.file);
				} else {
					reject(new Error('No original file available'));
				}
			});
		} else if (media.type === 'text' && media.original?.file) {
			const text = await media.original.file.text();
			media.original.text = text;
		}
	} finally {
		A.mediaProcessing = false;
	}
}

interface ResizePreset {
	label: string;
	pixels?: number;
	long?: number;
}

export const resizePresets: { [key: string]: ResizePreset } = {
	original: { label: 'Original' },
	xs: { pixels: 128 * 128, label: '0.016 MP (~ 128x128)' },
	sm: { pixels: 256 * 256, label: '0.065 MP (~ 256x256)' },
	md: { pixels: 512 * 512, label: '0.25 MP (~ 512x512)' },
	lg: { pixels: 1024 * 1024, label: '1 MP (~ 1024x1024)' },
	xl: { pixels: 2048 * 2048, label: '4 MP (~ 2048x2048)' },
	// 'long-xs': { long: 256, label: 'Long side to 128px' },
	// 'long-sm': { long: 512, label: 'Long side to 256px' },
	// 'long-md': { long: 1024, label: 'Long side to 512px' },
	// 'long-lg': { long: 2048, label: 'Long side to 1024px' },
	// 'long-xl': { long: 4096, label: 'Long side to 2048px' },
	custom: { label: 'Custom' }
};

export async function mediaProcessResize(media: MediaInterface) {
	assert(media.original);
	assert(media.original.file);
	// await syncMedia(media);
	if (!media.resized && media.type === 'image') {
		assert(media.originalWidth);
		assert(media.originalHeight);

		if (
			media.resizedWidth &&
			media.resizedWidth !== media.originalWidth &&
			media.resizedHeight &&
			media.resizedHeight !== media.originalHeight
		) {
			media.resized = await resizeImage(media.original, media.resizedWidth, media.resizedHeight);
			debug('Resized media for %o', media);
		}
	}
}

export async function mediaCreateThumbnail(media: MediaInterface) {
	assert(media.original);
	assert(media.original.file);
	// await syncMedia(media);
	if (!media.thumbnail) {
		if (media.type === 'image') {
			assert(media.originalWidth);
			assert(media.originalHeight);
			debug('Creating image thumbnail from original %o', $state.snapshot(media));
			const targetPixels = 128 * 128;
			const aspectRatio = media.originalWidth / media.originalHeight;
			let newWidth, newHeight;

			if (aspectRatio > 1) {
				newWidth = Math.sqrt(targetPixels * aspectRatio);
				newHeight = newWidth / aspectRatio;
			} else {
				newHeight = Math.sqrt(targetPixels / aspectRatio);
				newWidth = newHeight * aspectRatio;
			}

			media.thumbnail = await resizeImage(media.original, Math.round(newWidth), Math.round(newHeight));
		} else if (media.type === 'text' && media.original?.text) {
			debug('Creating text thumbnail from original %o ', $state.snapshot(media));
			const text = media.original.text.slice(0, 200);
			media.thumbnail = {
				userID: media.userID,
				mimeType: 'text/plain',
				size: text.length,
				text: text,
				file: new File([text], 'thumbnail.txt', { type: 'text/plain' })
				// url: URL.createObjectURL(new Blob([text.slice(0, maxChars)], { type: 'text/plain' }))
			};
		} else if (media.type === 'pdf') {
			media.thumbnail = await pdfThumbnail(media.original)
		}
	}
}

export async function mediaUpdateText(media: MediaInterface) {
	assert(media.original);
	assert(media.original.text !== undefined);

	// Create a blob from the text
	const file = new File([media.original.text], media.filename, { type: media.original.mimeType });

	// Update the media.original FileInterface
	media.original.file = file;
	media.original.size = file.size;
	media.original.mimeType = file.type;

	if (media.original.url) URL.revokeObjectURL(media.original.url);
	// Update the URL after successful upload
	media.original.url = URL.createObjectURL(file);

	if (media.original.id) {
		// Use APIupsertFile to update the file
		try {
			const updatedFile = await APIupsertFile(media.original, true);

			// Update media.original with the returned data
			Object.assign(media.original, updatedFile);

			assert(updatedFile.uploadURL, 'Updated file URL not found');

			// If we got an upload URL, use it to upload the file

			const uploadResponse = await fetch(updatedFile.uploadURL, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type
				}
			});

			if (!uploadResponse.ok) {
				throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
			}

			debug('Text media updated and uploaded successfully');
		} catch (error) {
			console.error('Failed to update or upload text media:', error);
			throw error;
		}
	}

	media.thumbnail = undefined;
	await mediaCreateThumbnail(media);
}

export async function mediaResizeFromPreset(
	media: MediaInterface,
	preset: string,
	resizeWidth?: number,
	resizeHeight?: number
): Promise<void> {
	debug('resizeOriginal', media, preset);

	assert(media.original, 'Original media not found');
	assert(media.original.file, 'Original media file not found');
	assert(media.originalWidth && media.originalHeight, 'Media original width/height not found');
	assert(preset, 'Invalid resize preset');
	assert(media.type === 'image', 'Only images can be resized');

	const { pixels, long } = resizePresets[preset];
	let { width, height } = { width: media.originalWidth, height: media.originalHeight };
	debug('resizeOriginal', preset, pixels, long);
	if (pixels) {
		const ratio = Math.sqrt(pixels / (media.originalWidth * media.originalHeight));
		width = media.originalWidth * ratio;
		height = media.originalHeight * ratio;
		// } else if (long) {
		// 	const ratio = long / Math.max(media.originalWidth, media.originalHeight);
		// 	width = media.originalWidth * ratio;
		// 	height = media.originalHeight * ratio;
	} else if (preset === 'custom') {
		if (!resizeWidth || !resizeHeight) throw new Error('Custom resize width/height not found');
		width = resizeWidth;
		height = resizeHeight;
	}
	width = Math.round(width);
	height = Math.round(height);
	// if (width !== media.originalWidth || height !== media.originalHeight) {
	// 	media.resized = await resizeImage(media.original, width, height);
	// }
	if (width !== media.resizedWidth || height !== media.resizedHeight) {
		media.resizedWidth = width;
		media.resizedHeight = height;
		media.resized = await resizeImage(media.original, width, height);
		mediaCreateThumbnail(media);
		Object.assign(media, await APIupsertMedia(media));
	}
}

export async function uploadChangedMedia(media: MediaInterface) {
	if (!A.conversation?.id) throw new Error('Conversation ID missing');

	const uploadPromises = [];
	let mediaNeedsUpdate = false;

	if (!media.original && media.originalID) mediaNeedsUpdate = true;
	if (media.original && !media.original.id) {
		mediaNeedsUpdate = true;
		uploadPromises.push(async () => {
			assert(media.original);
			Object.assign(media.original, await uploadFile(media.original));
		});
	}

	if (!media.thumbnail && media.thumbnailID) mediaNeedsUpdate = true;
	if (media.thumbnail && !media.thumbnail.id) {
		mediaNeedsUpdate = true;
		uploadPromises.push(async () => {
			assert(media.thumbnail);
			Object.assign(media.thumbnail, { ...(await uploadFile(media.thumbnail)), isThumbnail: true });
		});
	}

	if (mediaNeedsUpdate) {
		await Promise.all(uploadPromises.map((p) => p()));

		media.originalID = media.original?.id ?? null;
		media.thumbnailID = media.thumbnail?.id ?? null;
		media.conversationID = A.conversation.id ?? null;

		const updatedMedia = await APIupsertMedia(media);
		debug('media uploaded!', updatedMedia);
		Object.assign(media, updatedMedia);
	}
}

export async function uploadConversationMedia() {
	if (!A.conversation) throw Error('Conversation missing');

	debug('uploadMedia', $state.snapshot(A.conversation));

	A.mediaUploading = true;

	// Can't upload media for a non-existing conversation.
	let createdNewConversation = false;
	if (!A.conversation.id) {
		Object.assign(A.conversation, await APIupsertConversation(A.conversation));
		createdNewConversation = true;
	}
	if (!A.conversation.media) A.conversation.media = [];

	await Promise.all(A.conversation.media.map(uploadChangedMedia));
	debug('All media uploaded!', $state.snapshot(A.conversation));
	A.mediaUploading = false;
	return createdNewConversation;
}

export async function fileToMedia(file: File): Promise<MediaInterface> {
	if (!A.dbUser) throw new Error('User not logged in');

	const type = await typeFromFile(file);
	debug('fileToMedia', type);

	const m: MediaInterface = {
		active: true,
		repeat: true,
		userID: A.dbUser.id,
		title: file.name,
		filename: file.name,
		type,
		original: {
			mimeType: file.type,
			size: file.size,
			userID: A.dbUser.id,
			file: file
		}
	};

	await syncMedia(m);
	await mediaCreateThumbnail(m);
	return m;
}
