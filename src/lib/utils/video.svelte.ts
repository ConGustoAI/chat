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
							url: URL.createObjectURL(blob),
							blob,
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
