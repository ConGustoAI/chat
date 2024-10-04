import { dbUser } from '$lib/stores/appstate';

import dbg from 'debug';
import { get } from 'svelte/store';

const debug = dbg('app:lib:media_utils');


    // Resize image
	export async function resizeImage(
		file: FileInterface,
		width: number,
		height: number,
		pad: boolean = false
	): Promise<FileInterface> {
		// if (!$dbUser) throw new Error('No user');
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas context not found');
		if (!file.file) throw new Error('File file not found');

		debug('resizeImage', file, width, height);
		const image = new Image();
		const p = new Promise((resolve, reject) => {
			image.onload = resolve;
			image.onerror = reject;
		});
		image.src = URL.createObjectURL(file.file); // file.file is the File object
		debug('image', image);
		await p;

		canvas.width = width;
		canvas.height = height;

		if (pad) {
			context.fillStyle = 'black';
			context.fillRect(0, 0, width, height);

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

			[ drawWidth, drawHeight, offsetX, offsetY ] = [ drawWidth, drawHeight, offsetX, offsetY ].map(Math.round);

			context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
		} else {
			context.drawImage(image, 0, 0, width, height);
		}

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
		if (!blob) throw new Error('Blob is null');
		const resizedFile = new File([blob], 'resized', { type: 'image/jpeg' });
		debug('blob', blob);
		return {
			userID: get(dbUser)?.id ?? 'anon',
			url: URL.createObjectURL(blob),
			mimeType: 'image/jpeg',
			size: blob.size,
			file: resizedFile
		};
	}
