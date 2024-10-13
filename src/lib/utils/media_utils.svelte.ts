import { A } from '$lib/appstate.svelte';
import { uploadFile } from '$lib/utils/files_client.svelte';
import dbg from 'debug';
import { APIupsertConversation, APIupsertMedia, mediaInterfaceFilter } from '../api';
import { assert } from './utils';
import { goto } from '$app/navigation';

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

	debug('resizeImage', file, width, height);
	const image = new Image();
	const p = new Promise((resolve, reject) => {
		image.onload = resolve;
		image.onerror = reject;
	});
	image.src = URL.createObjectURL(file.file);
	await p;
	debug('image', image);

	canvas.width = width;
	canvas.height = height;

	if (pad) {
		// Clear the canvas with a transparent background
		context.clearRect(0, 0, width, height);

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
}

export async function syncFileURL(file: FileInterface) {
	if (!file.file && !file.url) {
		throw new Error('FileInterface must have either file or url');
	}

	if (!file.file && file.url) {
		const response = await fetch(file.url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const blob = await response.blob();
		file.file = new File([blob], file.url.split('/').pop() || 'file', { type: file.mimeType });
	}

	if (!file.url && file.file) {
		file.url = URL.createObjectURL(file.file);
	}
}

export async function syncMediaFileURLs(media: MediaInterface) {
	if (!media.original) throw new Error('MediaInterface must have an original file');
	if (media.original) await syncFileURL(media.original);
	if (media.thumbnail) await syncFileURL(media.thumbnail);
	if (media.resized) await syncFileURL(media.resized);
	if (media.cropped) await syncFileURL(media.cropped);

	// This will only run once, when the new media is processed for the first time.
	if ((!media.originalWidth || !media.originalHeight) && media.original?.file) {
		const img = new Image();
		await new Promise<void>((resolve, reject) => {
			img.onload = () => {
				media.originalWidth = img.naturalWidth;
				media.originalHeight = img.naturalHeight;
				URL.revokeObjectURL(img.src);
				resolve();
			};
			img.onerror = (error) => {
				URL.revokeObjectURL(img.src);
				reject(new Error('Failed to load image: ' + error));
			};
			if (media.original?.file) {
				img.src = URL.createObjectURL(media.original.file);
			} else {
				reject(new Error('No original file available'));
			}
		});
	}

	// if (media.resizedWidth && media.resizedHeight && !media.resized) {
	// 	media.resized = await resizeImage(media.original, media.resizedWidth, media.resizedHeight);
	// }

	// if (!media.thumbnail) {
	// 	media.thumbnail = await resizeImage(media.original, 128, 128, true);
	// }

	// media.newResizedHeight = media.resizedHeight;
	// media.newResizedWidth = media.resizedWidth;
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
	'long-xs': { long: 256, label: 'Long side to 128px' },
	'long-sm': { long: 512, label: 'Long side to 256px' },
	'long-md': { long: 1024, label: 'Long side to 512px' },
	'long-lg': { long: 2048, label: 'Long side to 1024px' },
	'long-xl': { long: 4096, label: 'Long side to 2048px' },
	custom: { label: 'Custom' }
};

export async function mediaCreateThumbnail(media: MediaInterface) {
	assert(media.original);
	assert(media.original.file);
	await syncMediaFileURLs(media);
	if (!media.thumbnail) {
		media.thumbnail = await resizeImage(media.original, 128, 128);
		debug('Created thumbnail for %o', media);
	}
}

export async function mediaResizeOriginal(
	media: MediaInterface,
	preset: string,
	resizeWidth?: number,
	resizeHeight?: number
): Promise<void> {
	debug('resizeOriginal', media, preset);

	if (!media.original) throw new Error('Original media not found');
	if (!media.original.file) throw new Error('Original media file not found');
	if (!media.originalWidth || !media.originalHeight) throw new Error('Media orignal width/height not found');

	if (!preset) throw new Error('Invalid resize preset');

	const { pixels, long } = resizePresets[preset];
	let { width, height } = { width: media.originalWidth, height: media.originalHeight };
	debug('resizeOriginal', preset, pixels, long);
	if (pixels) {
		const ratio = Math.sqrt(pixels / (media.originalWidth * media.originalHeight));
		width = media.originalWidth * ratio;
		height = media.originalHeight * ratio;
	} else if (long) {
		const ratio = long / Math.max(media.originalWidth, media.originalHeight);
		width = media.originalWidth * ratio;
		height = media.originalHeight * ratio;
	} else if (preset === 'custom') {
		if (!resizeWidth || !resizeHeight) throw new Error('Custom resize width/height not found');
		width = resizeWidth;
		height = resizeHeight;
	}
	width = Math.round(width);
	height = Math.round(height);
	if (width !== media.originalWidth || height !== media.originalHeight) {
		media.resized = await resizeImage(media.original, width, height);
	}
	media.newResizedWidth = width;
	media.newResizedHeight = height;
}

export async function uploadChangedMedia(media: MediaInterface) {
	if (!A.conversation?.id) throw new Error('Conversation ID missing');

	const uploadPromises = [];
	let mediaNeedsUpdate = false;

	if (!media.original && media.originalID) mediaNeedsUpdate = true;
	if (media.original && !media.original.id) {
		mediaNeedsUpdate = true;
		uploadPromises.push(async () => {
			media.original = { ...media.original, ...(await uploadFile(media.original!)) };
		});
	}

	if (!media.resized && media.resizedID) mediaNeedsUpdate = true;
	if (
		media.resized &&
		(!media.resized.id || media.resizedHeight != media.newResizedHeight || media.resizedWidth != media.newResizedWidth)
	) {
		mediaNeedsUpdate = true;
		uploadPromises.push(async () => {
			media.resized = { ...media.resized, ...(await uploadFile(media.resized!)) };
		});
	}

	if (!media.thumbnail && media.thumbnailID) mediaNeedsUpdate = true;
	if (media.thumbnail && !media.thumbnail.id) {
		mediaNeedsUpdate = true;
		uploadPromises.push(async () => {
			media.thumbnail!.isThumbnail = true;
			media.thumbnail = { ...media.thumbnail, ...(await uploadFile(media.thumbnail!)) };
		});
	}

	if (mediaNeedsUpdate) {
		await Promise.all(uploadPromises.map((p) => p()));

		media.originalID = media.original?.id ?? null;
		media.resizedID = media.resized?.id ?? null;
		media.thumbnailID = media.thumbnail?.id ?? null;
		media.conversationID = A.conversation.id ?? null;

		const updatedMedia = await APIupsertMedia(mediaInterfaceFilter(media));
		debug('media uploaded!', updatedMedia);
		Object.assign(media, updatedMedia);
	}
}

// export async function conversationUploadChangedMedia() {
// 	if (A.conversation?.media) await Promise.all(A.conversation.media.map(uploadChangedMedia));
// }

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
	A.mediaUploading = false;
	debug('All media uploaded!', $state.snapshot(A.conversation));
	if (createdNewConversation) await goto(`/chat/${A.conversation.id}`);
}
