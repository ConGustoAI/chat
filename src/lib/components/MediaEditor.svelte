<script lang="ts">
	import { dbUser } from '$lib/stores/appstate';
	import dbg from 'debug';
	import { onMount } from 'svelte';
	const debug = dbg('app:ui:components:MediaPreview');

	export let media: MediaInterface;
	let progressBar: HTMLProgressElement;

	function isVideo(media: MediaInterface) {
		return media.type === 'video';
	}

	// Handle video seek based on mouse position
	function handleVideoSeek(event: MouseEvent) {
		const video = event.currentTarget as HTMLVideoElement;
		const rect = video.getBoundingClientRect();
		const xPos = event.clientX - rect.left;
		const percentage = xPos / rect.width;

		video.currentTime = percentage * video.duration; // Use video.duration
		video.muted = true; // Mute the video
		video.play();
	}

	// Stop video playback when mouse leaves
	function handleVideoStop(event: MouseEvent) {
		const video = event.currentTarget as HTMLVideoElement;
		video.pause();
	}

	// Update progress bar based on video time
	function updateProgressBar(event: Event) {
		const video = event.currentTarget as HTMLVideoElement;
		if (progressBar) {
			const percentage = (video.currentTime / video.duration) * 100;
			progressBar.value = percentage;
		}
	}

	async function updateMedia() {
		debug('updateMedia', media);
	}

	let image: HTMLImageElement;

	const resizePresets: { [key: string]: any } = {
		original: { label: 'Original' },
		xs: { pixels: 128 * 128, label: 'Same pixels as 128x128' },
		sm: { pixels: 256 * 256, label: 'Same pixels as 256x256' },
		md: { pixels: 512 * 512, label: 'Same pixels as 512x512' },
		lg: { pixels: 1024 * 1024, label: 'Same pixels as 1024x1024' },
		xl: { pixels: 2048 * 2048, label: 'Same pixels as 2048x2048' },
		'long-xs': { long: 256, label: 'Long side to 128' },
		'long-sm': { long: 512, label: 'Long side to 256' },
		'long-md': { long: 1024, label: 'Long side to 512' },
		'long-lg': { long: 2048, label: 'Long side to 1024' },
		'long-xl': { long: 4096, label: 'Long side to 2048' },
		custom: { label: 'Custom' }
	};

	let resize = 'original';
	let resizeWidth: number;
	let resizeHeight: number;

	// let hiddenCanvasOriginal: HTMLCanvasElement;
	let hiddenImageOriginal: HTMLImageElement;
	let hiddenImageResized: HTMLImageElement;
	// // let hiddenImageCropped: HTMLImageElement;

	// let hiddenThumbnailCanvas: HTMLCanvasElement;

	// let hiddenImageResizedEdited: HTMLImageElement;
	// let hiddenImageCroppedEdited: HTMLImageElement;

	// Resize image
	async function resizeImage(file: FileInterface, width: number, height: number, pad: boolean = false): Promise<FileInterface> {
		// if (!$dbUser) throw new Error('No user');
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas context not found');
		if (!file.file) throw new Error('File file not found');

		debug('resizeImage', file, width, height);
		// await new Promise((resolve, reject) => {
		// 	hiddenImageOriginal.crossOrigin = 'anonymous'; // Add this line
		// 	hiddenImageOriginal.onload = resolve;
		// 	hiddenImageOriginal.onerror = reject;
		// 	if (!file.url) throw new Error('No file URL');
		// 	hiddenImageOriginal.src = file.url;
		// });
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

			context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
		} else {
			context.drawImage(image, 0, 0, width, height);
		}

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
		if (!blob) throw new Error('Blob is null');
		const resizedFile = new File([blob], 'resized', { type: 'image/jpeg' });
		debug('blob', blob);
		return {
			userID: $dbUser?.id ?? 'anon',
			url: URL.createObjectURL(blob),
			mimeType: 'image/jpeg',
			size: blob.size,
			file: resizedFile
		};
	}

	async function resizeOriginal() {
		debug('resizeOriginal', media, resize);

		if (!media.original) throw new Error('Original media not found');
		if (!media.originalWidth || !media.originalHeight) throw new Error('Media orignal width/height not found');

		const p = resizePresets[resize];
		if (!p) throw new Error('Invalid resize preset');

		const { pixels, long } = p;
		debug('resizeOriginal', p, pixels, long);
		if (pixels) {
			const ratio = Math.sqrt(pixels / (media.originalWidth * media.originalHeight));
			media.resized = await resizeImage(media.original, media.originalWidth * ratio, media.originalHeight * ratio);
		} else if (long) {
			const ratio = long / Math.max(media.originalWidth, media.originalHeight);
			media.resized = await resizeImage(media.original, media.originalWidth * ratio, media.originalHeight * ratio);
		} else if (resize === 'custom') {
			if (!resizeWidth || !resizeHeight) throw new Error('Custom resize width/height not found');
			media.resized = await resizeImage(media.original, resizeWidth, resizeHeight);
		}
	}

	let resizedImage: string;

	let displayedImageURL: string;
	$: {
		if (media.resized?.file) {
			displayedImageURL = URL.createObjectURL(media.resized.file);
		} else if (media.original?.file) {
			displayedImageURL = URL.createObjectURL(media.original.file);
		}
	}
	// displayedImageURL = media.cropped?.url || media.resized?.url || media.original?.url || '';
	// $: if (hiddenImageOriginal) hiddenImageOriginal.src = media.original?.url ?? '';

	let updatingThumbnail = false;
	let scheduledThumbailUpdate = false;
	async function updateThumbnail() {
		if (updatingThumbnail) {
			scheduledThumbailUpdate = true;
			return;
		}

		updatingThumbnail = true;
		debug('updateThumbnail', media);
		if (media.resized) {
			media.thumbnail = await resizeImage(media.resized, 128, 128, true);
		} else if (media.original) {
			media.thumbnail = await resizeImage(media.original, 128, 128, true);
		}
		updatingThumbnail = false;
		if (scheduledThumbailUpdate) {
			scheduledThumbailUpdate = false;
			updateThumbnail();
		}
	}

	let originalLoaded = false;
	onMount(async () => {
		debug('onMount', media);

		hiddenImageOriginal.onload = async () => {
			debug('hiddenImageOriginal loaded');
			if (!media.original) throw new Error('Original media not found, but image loaded');
			if (
				media.originalWidth !== hiddenImageOriginal.naturalWidth ||
				media.originalHeight !== hiddenImageOriginal.naturalHeight
			) {
				debug('original size changed?');
				media.originalWidth = hiddenImageOriginal.naturalWidth;
				media.originalHeight = hiddenImageOriginal.naturalHeight;
			}

			if (!media.original?.file) {
				const canvas = document.createElement('canvas');
				canvas.width = hiddenImageOriginal.naturalWidth;
				canvas.height = hiddenImageOriginal.naturalHeight;

				const context = canvas.getContext('2d');
				if (!context) throw new Error('Canvas context not found');
				context.drawImage(hiddenImageOriginal, 0, 0);

				const blob = await new Promise<Blob | null>((resolve) =>
					canvas.toBlob(resolve, media.original?.mimeType || 'image/jpeg')
				);
				if (!blob) throw new Error('Blob is null');
				media.original.file = new File([blob], media.filename, { type: media.original.mimeType });

				if (!media.resized) {
					// Schedule thumbnail update without awaiting
					await updateThumbnail();
				}
			}
			originalLoaded = true;
		};

		hiddenImageOriginal.src = media.original?.url ?? '';

		hiddenImageResized.onload = () => {
			debug('hiddenImageResized loaded');
			if (
				media.resizedWidth !== hiddenImageResized.naturalWidth ||
				media.resizedHeight !== hiddenImageResized.naturalHeight
			) {
				debug('resized size changed?');
				media.resizedWidth = hiddenImageResized.naturalWidth;
				media.resizedHeight = hiddenImageResized.naturalHeight;
			}
			// Schedule thumbnail update without awaiting
			updateThumbnail();
		};
	});

	$: debug('media', media);
	// $: debug('resizedImage', resizedImage);

	let titleUpdating = false;
</script>

<!-- Used for image resizing/cropping images -->
<!-- <canvas bind:this={hiddenCanvasOriginal} class="hidden"></canvas> -->

<!-- <canvas bind:this={hiddenThumbnailCanvas} class="hidden"></canvas> -->

<img bind:this={hiddenImageResized} alt="decoy" class="hidden" />
<!-- <img bind:this={hiddenImageCropped} src={media.cropped?.url} alt="decoy" class="hidden" /> -->

<!-- Images after possible edits -->
<!-- <img bind:this={hiddenImageResizedEdited} src={media.resized?.url} alt="decoy" class="hidden" />
<img bind:this={hiddenImageCroppedEdited} src={media.cropped?.url} alt="decoy" class="hidden" /> -->

<div class="grid h-full max-h-full min-h-full shrink-0 grow grid-cols-[auto,min-content,min-content] grid-rows-1 gap-1">
	<!-- <div class="flex h-full max-h-full min-h-0 shrink flex-col items-start p-2"> -->
	<img
		src={displayedImageURL}
		alt={media.title}
		class="pixilated m-auto h-full max-h-full min-h-full shrink grow justify-self-center border object-contain p-1 align-middle"
		class:hidden={!originalLoaded} />
	<img
		bind:this={hiddenImageOriginal}
		alt="decoy"
		class:hidden={true}
		crossorigin="anonymous"
		class="pixilated m-auto h-full max-h-full min-h-full shrink grow justify-self-center border object-contain p-1 align-middle" />

	<!-- </div> -->
	<div class="divider divider-horizontal"></div>

	<div class="m-1 flex flex-col gap-1">
		<div class="flex items-baseline justify-start gap-2">
			<p class="label mr-auto">Title</p>
			{#if titleUpdating}
				<span class="loading loading-sm"></span>
			{/if}

			<input
				type="text"
				class="input input-sm input-bordered w-48 justify-self-end"
				bind:value={media.title}
				on:change={async (e) => {
					titleUpdating = true;
					await updateMedia();
					titleUpdating = false;
				}} />
		</div>

		<div class="flex items-baseline justify-between gap-2">
			<p class="label">Size</p>
			<select
				class="select select-bordered select-sm w-48"
				bind:value={resize}
				on:change={async () => {
					debug('resizePreset', resize);
					await resizeOriginal();
				}}>
				{#each Object.keys(resizePresets) as preset}
					<option value={preset}>{resizePresets[preset].label}</option>
				{/each}
			</select>
		</div>
		{#if resize !== 'custom'}
			<div class="flex items-baseline justify-between gap-2">
				<p class="label">Resolution</p>
				<div class="flex w-48 items-baseline justify-between gap-2">
					<input
						type="number"
						class="input input-sm input-bordered w-full shrink"
						placeholder="Width"
						bind:value={resizeWidth} />
					x
					<input
						type="number"
						class="input input-sm input-bordered w-full"
						placeholder="Height"
						bind:value={resizeHeight} />
				</div>
			</div>
		{/if}

		<div class="mt-auto flex flex-col items-end justify-self-end">
			<img src={media.thumbnail?.url} alt="preview" class="h-32 w-32 border object-contain" />
			<p class="">{media.filename}</p>
			<p>Original size: {hiddenImageOriginal?.naturalWidth}x{hiddenImageOriginal?.naturalHeight}</p>
			<p>Resized size: {hiddenImageResized?.naturalWidth}x{hiddenImageResized?.naturalHeight}</p>
			<p>Media original size: {media.originalWidth}x{media.originalHeight}</p>
		</div>
	</div>

	<!-- <div class="flex gap-2">
        <h2 class="text-lg font-bold">{media.title}</h2>
        <button class="btn btn-sm btn-outline" on:click={() => (titleEdit = !titleEdit)}>Edit</button>
    </div> -->
</div>

<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if false}
	<div class="flex flex-col justify-start gap-2 rounded-sm">
		<!-- {#if media.type === 'video'}
			<video
				class="grow object-cover"
				on:mousemove={(event) => handleVideoSeek(event)}
				on:mouseleave={handleVideoStop}
				on:timeupdate={updateProgressBar}>
				<source src={URL.createObjectURL(media.file)} type={media.mimeType} />
				Your browser does not support the video tag.
			</video>
			<progress
				bind:this={progressBar}
				class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
				value={0}
				max={100}></progress>
		{:else}
			<img
				src={media.url ?? '#'}
				alt={media.title}
				class="mx-auto my-auto h-[inherit] max-h-[100%] bg-gray-600 object-contain" />
		{/if} -->

		<!-- <div class="tab-content h-[inherit] max-h-[100vh] flex-col justify-center bg-gray-600 p-6">
			<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/08-130Miraflores-NYK_DIANA_-_Flickr_-_Salvador.C.jpg/450px-08-130Miraflores-NYK_DIANA_-_Flickr_-_Salvador.C.jpg" alt="cat" class="h-full w-full object-contain" />

		</div> -->

		<!-- <label class="absolute right-1 top-1 z-30">
			<input type="checkbox" class="checkbox checkbox-sm" />
		</label>
		{#if isHovered}
			<input type="text" class="input input-xs input-bordered absolute bottom-1 w-full" />
		{:else}
			<div class="break-all text-sm"></div>
		{/if} -->
	</div>
{/if}

<style>
	.pixilated {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		-ms-interpolation-mode: nearest-neighbor;
	}
</style>
