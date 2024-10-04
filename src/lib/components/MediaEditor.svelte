<script lang="ts">
	import { dbUser } from '$lib/stores/appstate';
	import { Check } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import dbg from 'debug';
	import { APIupsertMedia, MediaInterfaceFilter } from '$lib/api';
	import { mediaTable } from '$lib/db/schema';
	import { resizeImage } from '$lib/media_utils';

	const debug = dbg('app:ui:components:MediaPreview');

	export let media: MediaInterface;
	let progressBar: HTMLProgressElement;

	function isVideo(media: MediaInterface) {
		return media.type === 'video';
	}

	async function updateMedia() {
		media = await APIupsertMedia(MediaInterfaceFilter(media));
	}

	const resizePresets: { [key: string]: any } = {
		"original": { label: 'Original' },
		"xs": { pixels: 128 * 128, label: '0.016 MP (~ 128x128)' },
		"sm": { pixels: 256 * 256, label: '0.065 MP (~ 256x256)' },
		"md": { pixels: 512 * 512, label: '0.25 MP (~ 512x512)' },
		"lg": { pixels: 1024 * 1024, label: '1 MP (~ 1024x1024)' },
		"xl": { pixels: 2048 * 2048, label: '4 MP (~ 2048x2048)' },
		'long-xs': { long: 256, label: 'Long side to 128px' },
		'long-sm': { long: 512, label: 'Long side to 256px' },
		'long-md': { long: 1024, label: 'Long side to 512px' },
		'long-lg': { long: 2048, label: 'Long side to 1024px' },
		'long-xl': { long: 4096, label: 'Long side to 2048px' },
		"custom": { label: 'Custom' }
	};

	let resize = 'original';
	let resizeWidth: number;
	let resizeHeight: number;

	// let hiddenCanvasOriginal: HTMLCanvasElement;
	let hiddenImageOriginal: HTMLImageElement;

	async function resizeOriginal() {
		debug('resizeOriginal', media, resize);

		if (!media.original) throw new Error('Original media not found');
		if (!media.original.file) throw new Error('Original media file not found');
		if (!media.originalWidth || !media.originalHeight) throw new Error('Media orignal width/height not found');

		const p = resizePresets[resize];
		if (!p) throw new Error('Invalid resize preset');

		const { pixels, long } = p;
		let { width, height } = { width: media.originalWidth, height: media.originalHeight };
		debug('resizeOriginal', p, pixels, long);
		if (pixels) {
			const ratio = Math.sqrt(pixels / (media.originalWidth * media.originalHeight));
			width = media.originalWidth * ratio;
			height = media.originalHeight * ratio;
		} else if (long) {
			const ratio = long / Math.max(media.originalWidth, media.originalHeight);
			width = media.originalWidth * ratio;
			height = media.originalHeight * ratio;
		} else if (resize === 'custom') {
			if (!resizeWidth || !resizeHeight) throw new Error('Custom resize width/height not found');
			width = resizeWidth;
			height = resizeHeight;
		}

		if (width !== media.originalWidth || height !== media.originalHeight) {
			media.resized = await resizeImage(media.original, width, height);
			media.newResizedWidth = width;
			media.newResizedHeight = height;
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
		if (!media.original) throw new Error('Original media not found');
		if (updatingThumbnail) {
			scheduledThumbailUpdate = true;
			return;
		}

		updatingThumbnail = true;
		debug('updateThumbnail', media);
		// if (media.resized) {
		// 	media.thumbnail = await resizeImage(media.resized, 128, 128, true);
		// } else if (media.original) {
		media.thumbnail = await resizeImage(media.original, 128, 128, true);
		// }
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
	});

	$: debug('media', media);

	let titleUpdating = false;
</script>

<div class="flex h-[100vh] max-h-full min-h-full shrink-0 grow">
	<!-- <div class="flex h-full max-h-full min-h-0 shrink flex-col items-start p-2"> -->
	<img
		src={displayedImageURL}
		alt={media.title}
		class="pixilated ml-auto h-full max-h-full min-h-full shrink grow justify-self-center object-contain align-middle" />
	<img
		bind:this={hiddenImageOriginal}
		alt="decoy"
		class:hidden={true}
		crossorigin="anonymous"
		class="pixilated m-auto h-full max-h-full min-h-full shrink grow justify-self-center border object-contain p-1 align-middle" />

	<!-- </div> -->
	<div class="divider divider-horizontal mx-1 grow-0 px-1"></div>

	<div class="m-1 flex grow-0 flex-col items-end gap-1">
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
		{#if resize === 'custom'}
			<div class="flex items-center justify-between gap-2">
				<p class="label">Resolution</p>
				<div class="flex w-48 items-baseline justify-between gap-2">
					<input
						type="number"
						class="input input-sm input-bordered w-full shrink"
						placeholder="W"
						bind:value={resizeWidth} />
					x
					<input type="number" class="input input-sm input-bordered w-full" placeholder="H" bind:value={resizeHeight} />
				</div>
			</div>
			<button class="align-self-end btn btn-outline btn-sm w-fit" on:click={resizeOriginal}><Check /></button>
		{/if}

		<div class="mt-auto flex flex-col items-end justify-self-end">
			<img src={media.thumbnail?.url} alt="preview" class="h-32 w-32 border object-contain" />
			<p class="">{media.filename}</p>
			<!-- <p>Original size: {hiddenImageOriginal?.naturalWidth}x{hiddenImageOriginal?.naturalHeight}</p>
			<p>Resized size: {hiddenImageResized?.naturalWidth}x{hiddenImageResized?.naturalHeight}</p> -->
			<p>Media original size: {media.originalWidth}x{media.originalHeight}</p>
			<p>Media resized size: {media.resizedWidth}x{media.resizedHeight}</p>
			<p>Media new resized size: {media.newResizedWidth}x{media.newResizedHeight}</p>
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
