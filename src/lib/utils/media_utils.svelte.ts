import {
	APIdeleteMedia,
	APIupsertConversation,
	APIupsertFile,
	APIupsertMedia,
	APIupsertMessage,
	fetchFileByURL
} from '$lib/api';
import { A } from '$lib/appstate.svelte';
import { uploadFile } from '$lib/utils/files_client.svelte';
import dbg from 'debug';
import { typeFromFile } from './filetype';
import { PDFGetDocument, PDFGetMeta, PDFThumbnail, PDFToImages } from './pdf.svelte';
import { assert } from './utils';
import { VideoGetMeta, videoToImages } from './video.svelte';
import { googleUploadIfNeeded } from './googleUpload.svelte';

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

	A.mediaProcessing = (A.mediaProcessing ?? 0) + 1;
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
			userID: A.user?.id ?? 'anon',
			url: URL.createObjectURL(blob),
			mimeType: blob.type,
			size: blob.size,
			file: resizedFile
		};
	} finally {
		A.mediaProcessing--;
	}
}

export async function imageProcessResize(media: MediaInterface) {
	assert(media.original);
	assert(media.original.file);
	assert(media.type === 'image');
	if (!media.transformed) {
		assert(media.originalWidth);
		assert(media.originalHeight);

		if (
			media.resizedWidth &&
			media.resizedWidth !== media.originalWidth &&
			media.resizedHeight &&
			media.resizedHeight !== media.originalHeight
		) {
			media.transformed = resizeImage(media.original, media.resizedWidth, media.resizedHeight);
			debug('Resized media for %o', media);
		}
	}
}

export async function mediaUpdateText(media: MediaInterface) {
	assert(media.original);
	assert(media.text !== undefined);

	// Create a blob from the text
	const file = new File([media.text], media.filename, { type: media.original.mimeType });

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
	if (width === media.originalWidth && height === media.originalHeight) {
		media.resizedWidth = undefined;
		media.resizedHeight = undefined;
		media.transformed = undefined;
		mediaCreateThumbnail(media);
		Object.assign(media, await APIupsertMedia(media));
	} else if (width !== media.resizedWidth || height !== media.resizedHeight) {
		media.resizedWidth = width;
		media.resizedHeight = height;
		media.transformed = resizeImage(media.original, width, height);
		mediaCreateThumbnail(media);
		Object.assign(media, await APIupsertMedia(media));
	}
}

export async function uploadChangedMedia(media: MediaInterface, apiKey?: ApiKeyInterface) {
	assert(media.original);
	assert(A.conversation?.id); // Conversation should be created at this point.

	if (!media.original.id) {
		Object.assign(media.original, await uploadFile(media.original));
		assert(media.original.id);
		media.originalID = media.original.id;
		media.conversationID = A.conversation?.id;
		const updatedMedia = await APIupsertMedia(media);
		debug('media uploaded!', updatedMedia);
		Object.assign(media, updatedMedia);
	}

	if (apiKey) await googleUploadIfNeeded(media.original, media.filename, apiKey);
}

export async function uploadConversationMedia(apiKey?: ApiKeyInterface) {
	if (!A.conversation) throw Error('Conversation missing');

	debug('uploadMedia', $state.snapshot(A.conversation));

	A.mediaUploading = (A.mediaUploading ?? 0) + 1;

	try {
		// Can't upload media for a non-existing conversation.
		let createdNewConversation = false;
		if (!A.conversation.id) {
			Object.assign(A.conversation, await APIupsertConversation(A.conversation));
			createdNewConversation = true;
		}
		if (!A.conversation.media) A.conversation.media = [];

		await Promise.all(A.conversation.media.map((m) => uploadChangedMedia(m, apiKey)));
		debug('All media uploaded!', $state.snapshot(A.conversation));

		return createdNewConversation;
	} finally {
		A.mediaUploading--;
	}
}

export function mediaCreateThumbnail(media: MediaInterface): Promise<FileInterface> | undefined {
	assert(media.original);
	assert(media.original.file);

	assert(['image', 'audio', 'video', 'text', 'pdf'].includes(media.type), 'Invalid media type');

	if (media.type === 'image') {
		if (media.transformed) {
			debug('Creating image thumbnail from resized %o', $state.snapshot(media));
			assert(media.resizedWidth);
			assert(media.resizedHeight);

			const targetPixels = 128 * 128;
			if (media.resizedWidth * media.resizedHeight <= targetPixels) {
				return undefined;
			}

			const aspectRatio = media.resizedWidth / media.resizedHeight;
			let newWidth, newHeight;

			if (aspectRatio > 1) {
				newWidth = Math.sqrt(targetPixels * aspectRatio);
				newHeight = newWidth / aspectRatio;
			} else {
				newHeight = Math.sqrt(targetPixels / aspectRatio);
				newWidth = newHeight * aspectRatio;
			}

			return media.transformed.then((resized) => resizeImage(resized, Math.round(newWidth), Math.round(newHeight)));
		} else {
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

			return resizeImage(media.original, Math.round(newWidth), Math.round(newHeight));
		}
	} else if (media.type === 'pdf') {
		return PDFThumbnail(media);
	}
}

export async function syncFileURL(file: FileInterface, filename: string = 'file') {
	debug('syncFileURL', $state.snapshot(file));

	// Empty file
	if (!file.file && !file.url) {
		file.file = new File([], filename);
		file.url = URL.createObjectURL(file.file);
	}

	if (file.url && !file.file) {
		// We replace the original URL with a blob URL to avoid re-fetching the file.
		file.file = await fetchFileByURL(file.url, filename);
		URL.revokeObjectURL(file.url);
		file.url = URL.createObjectURL(file.file);
	}

	if (file.file && !file.url) {
		file.url = URL.createObjectURL(file.file);
	}
}

export async function syncMedia(media: MediaInterface) {
	if (!media.original) throw new Error('MediaInterface must have an original file');

	A.mediaProcessing = (A.mediaProcessing ?? 0) + 1;
	media.processing = (media.processing ?? 0) + 1;
	try {
		assert(media.original);
		await syncFileURL(media.original, media.filename);
		// if (media.thumbnail) await syncFileURL(media.thumbnail, media.filename);

		// This will only run once, when the new media is processed for the first time.
		if (media.type === 'image') {
			if (!media.originalWidth || !media.originalHeight) {
				assert(media.original?.file);
				const img = new Image();
				await new Promise<void>((resolve, reject) => {
					img.onload = () => {
						media.originalWidth = img.naturalWidth;
						media.originalHeight = img.naturalHeight;
						resolve();
					};
					img.onerror = (error) => {
						reject(new Error('Failed to load image: ' + error));
					};

					assert(media.original?.url);
					img.src = media.original.url;
				});
			}
			await imageProcessResize(media);
		} else if (media.type === 'video') {
			if (
				media.originalWidth === undefined ||
				media.originalHeight === undefined ||
				media.originalDuration === undefined
			) {
				const meta = await VideoGetMeta(media);
				media.originalWidth = meta.width;
				media.originalHeight = meta.height;
				media.originalDuration = meta.duration;
			}

			if (media.videoAsImages && !media.derivedImages) {
				debug('extractFrames', $state.snapshot(media));
				media.derivedImages = await videoToImages(media);
				debug('extractFrames done', $state.snapshot(media));
			}
		} else if (media.type === 'audio') {
			assert(media.original.file);

			debug('audio', media.original.file);
			const audioContext = new AudioContext();
			const arraybuffer = await media.original.file.arrayBuffer();

			const audioBuffer = await audioContext.decodeAudioData(arraybuffer);

			media.originalDuration = audioBuffer.duration;
			debug('audio duration', media.originalDuration);
		} else if (media.type === 'text') {
			assert(media.original.file);
			media.text = await media.original.file.text();
			debug('text', media.text);
		} else if (media.type === 'pdf') {
			if (!media.PDFDocument) media.PDFDocument = PDFGetDocument(media);
			if (!media.PDFMeta) media.PDFMeta = PDFGetMeta(media);

			// Note: This async function returns an array of promises when resolved.
			if (media.PDFAsImages && !media.derivedImages) media.derivedImages = await PDFToImages(media);
		}

		// if (!media.thumbnail) {
		media.thumbnail = mediaCreateThumbnail(media);
		debug('added thumbnail', media.thumbnail);
		// }
	} finally {
		media.processing--;
		A.mediaProcessing--;
	}
}

export async function fileToMedia(file: File): Promise<MediaInterface> {
	// if (!A.user) throw new Error('User not logged in');

	const type = await typeFromFile(file);
	debug('fileToMedia', type);

	const m: MediaInterface = {
		active: true,
		repeat: true,
		userID: A.user?.id ?? "",
		title: file.webkitRelativePath || file.name,
		filename: file.name,
		type,
		original: {
			mimeType: file.type || (type === 'text' ? 'text/plain' : 'application/octet-stream'),
			size: file.size,
			userID: A.user?.id ?? "",
			file: file
		}
	};

	if (m.type === 'pdf') {
		m.PDFAsImages = true;
		m.PDFAsImagesDPI = 150;
	}

	if (m.type === 'video') {
		m.videoAsImages = true;
	}

	return m;
}

export async function addImageToSkip(page: number) {
	assert(A.mediaEditing);
	if (!A.mediaEditing.imagesSkip) {
		A.mediaEditing.imagesSkip = [];
	}
	if (!A.mediaEditing.imagesSkip.includes(page)) {
		A.mediaEditing.imagesSkip.push(page);
	}
	await APIupsertMedia(A.mediaEditing);
}

export async function removeImageFromSkip(page: number) {
	assert(A.mediaEditing);
	if (A.mediaEditing.imagesSkip) {
		const index = A.mediaEditing.imagesSkip.indexOf(page);
		if (index > -1) {
			A.mediaEditing.imagesSkip.splice(index, 1);
		}
	}
	await APIupsertMedia(A.mediaEditing);
}

// Handle paste and drag&drop events
// For paste, set handle_string to true to handle text pastes as well as file pastes.
export async function handleDataTransfer({
	data,
	handle_string: handleString = false,
	message = undefined
}: {
	data: DataTransfer;
	handle_string?: boolean;
	message?: MessageInterface;
}) {
	const newMedia: MediaInterface[] = [];
	let newText: string | undefined;

	if (handleString) {
		Array.from(data.items ?? []).forEach((item) => {
			debug('item', item);

			if (item.kind === 'string' && item.type === 'text/plain') {
				newText = data.getData('text/plain');
			}
		});
	}

	// The paste can have either string or file data, but not both.
	// If we got string data, handle paste as normal.
	if (newText) {
		const numLines = newText.split('\n').length;

		if (numLines > 20 || newText.length > 1000) {
			let filename = 'pasted';
			let i = 1;
			while (A.conversation?.media?.some((m) => m.filename === filename)) {
				filename = `pasted-${i++}`;
			}

			const textFile = new File([newText], filename, { type: 'text/plain' });
			const textMedia = await fileToMedia(textFile);

			assert(A.conversation);

			if (!A.conversation.media) A.conversation.media = [];
			A.conversation.media.push(textMedia);
			syncMedia(A.conversation.media[A.conversation.media.length - 1]);

			A.conversationUploadOpen = true;
		} else {
			document.execCommand('insertText', false, newText);
		}
	} else {
		// If we got file data, handle it as media.
		await Promise.all(
			Array.from(data.items ?? []).map(async (item) => {
				if (item.kind === 'file') {
					const file = item.getAsFile();

					if (file) {
						// Don't add a file more than once
						if (
							!A.conversation?.media?.some(
								(m) =>
									m.original?.size === file.size &&
									m.original?.file?.lastModified === file.lastModified &&
									m.filename === file.name
							)
						) {
							debug('pushing ', file);
							newMedia.push(await fileToMedia(file));
						}
					}
				}
			})
		);

		if (newMedia.length) {
			assert(A.conversation);

			if (!A.conversation.media) A.conversation.media = [];
			A.conversation.media.push(...newMedia);
			newMedia.forEach(syncMedia);
			if (message) {
				if (!message.media) message.media = [];
				message.media.push(...newMedia);
			} else {
				A.conversationUploadOpen = true;
			}

			debug('Added media to conversation ', {
				newMedia: $state.snapshot(newMedia),
				conversation: $state.snapshot(A.conversation)
			});
		}
	}
}

export async function deleteMedia(media: MediaInterface) {
	assert(A.conversation);
	assert(A.conversation.media);

	const mediaIdx = A.conversation.media.indexOf(media);
	assert(mediaIdx !== -1);

	const promises = [];

	for (const message of A.conversation.messages ?? []) {
		if (media.id) {
			if (message.mediaIDs?.includes(media.id)) {
				const idx = message.mediaIDs.indexOf(media.id);
				if (idx !== -1) {
					message.mediaIDs.splice(idx, 1);
					promises.push(APIupsertMessage(message));
				}
			}
		}
		if (message.media?.includes(media)) {
			message.media.splice(message.media.indexOf(media), 1);
		}
	}
	if (media.id) promises.push(APIdeleteMedia(media.id));

	promises.push(APIupsertConversation(A.conversation));

	await Promise.all(promises);
	URL.revokeObjectURL(media.original?.url ?? '');
	URL.revokeObjectURL((await media.thumbnail)?.url ?? '');

	A.conversation.media.splice(A.conversation.media.indexOf(media), 1);
}

export function assistantSupportsMedia(assistant: AssistantInterface, media: MediaInterface) {
	if (media.type === 'text') return true;
	if (media.type === 'image' && assistant.images) return true;
	if (media.type === 'audio' && assistant.audio) return true;
	if (media.type === 'video') {
		if (!media.videoAsImages && !media.videoAsFile) return false;
		if (media.videoAsImages && !assistant.images) return false;
		if (media.videoAsFile && !assistant.video) return false;
		return true;
	}

	if (media.type === 'pdf') {
		if (!media.PDFAsImages && !media.PDFAsFile) return false;
		if (media.PDFAsImages && !assistant.images) return false;
		if (media.PDFAsFile && !assistant.pdf) return false;
		return true;
	}

	return false;
}
