import { assert } from './utils';

interface VideoMeta {
	width: number;
	height: number;
	duration: number;
}

export async function VideoGetMeta(media: MediaInterface): Promise<VideoMeta> {
	assert(media.type === 'video');
	assert(media.original.url);

	const video = document.createElement('video');
	video.preload = 'metadata';

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			resolve({
				duration: video.duration,
				width: video.videoWidth,
				height: video.videoHeight
			});
		};
		assert(media.original.url);
		video.src = media.original.url;
	});
}

export function videoToImages(media: MediaInterface, fps = 1): Promise<Promise<DerivedImageInterface>[]> {
	assert(media.type === 'video');
	assert(media.original.url);

	return new Promise((resolve) => {
		assert(media.original.url);
		const frames: Promise<DerivedImageInterface>[] = [];
		const video = document.createElement('video');
		video.src = media.original.url;

		const canvas = document.createElement('canvas');

		const ctx = canvas.getContext('2d');
		assert(ctx);

		video.onloadedmetadata = () => {
			video.currentTime = 0;
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
		};

		video.onseeked = () => {
			if (video.currentTime < video.duration) {
				const timestamp = video.currentTime;

				ctx.drawImage(video, 0, 0);
				const frame: Promise<DerivedImageInterface> = new Promise((resolve) => {
					canvas.toBlob((blob) => {
						assert(blob);
						resolve({
							userID: media.userID,
							size: blob.size,
							mimeType: 'image/jpeg',
							url: URL.createObjectURL(blob),
							file: new File([blob], `${media.filename}-${timestamp}.jpg`),
							width: canvas.width,
							height: canvas.height,
							timestamp
						});
					}, 'image/jpeg');
				});

				frames.push(frame);
				video.currentTime += 1 / fps;
			} else {
				resolve(frames);
			}
		};
	});
}

export async function VideoThumbnail(media: MediaInterface): Promise<FileInterface> {
	assert(media.type === 'video', 'Media is not a video');

	return new Promise((resolve) => {
		assert(media.original.url, 'Media has no original URL');
		const video = document.createElement('video');
		video.src = media.original.url;

		const canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;

		const ctx = canvas.getContext('2d');
		assert(ctx);

		video.onloadedmetadata = () => {
			// Seek to middle of video
			video.currentTime = video.duration / 2;
		};

		video.onseeked = () => {
			// Calculate dimensions to maintain aspect ratio
			const aspectRatio = video.videoWidth / video.videoHeight;
			let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

			if (aspectRatio > 1) {
				drawHeight = 128;
				drawWidth = drawHeight * aspectRatio;
				offsetX = -(drawWidth - 128) / 2;
			} else {
				drawWidth = 128;
				drawHeight = drawWidth / aspectRatio;
				offsetY = -(drawHeight - 128) / 2;
			}

			ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

			canvas.toBlob((blob) => {
				assert(blob);
				resolve({
					userID: media.userID,
					size: blob.size,
					mimeType: 'image/jpeg',
					url: URL.createObjectURL(blob),
					file: new File([blob], `${media.filename}-thumbnail.jpg`),
					isThumbnail: true
				});
			}, 'image/jpeg');
		};
	});
}
