<script lang="ts">
	import { dbUser } from '$lib/stores/appstate';
	import dbg from 'debug';
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

	let titleEdit = false;
	let newTitle: string;
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

	let resizePreset = 'original';

	let hiddenImage: HTMLImageElement;
	let hiddenCanvas: HTMLCanvasElement;

	// Resize image
	async function resizeImage(file: FileInterface, width: number, height: number) {
		if (!$dbUser) throw new Error('No user');
		const canvas = hiddenCanvas;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas context not found');

		await new Promise((resolve, reject) => {
			hiddenImage.onload = resolve;
			hiddenImage.onerror = reject;
			if (!file.url) throw new Error('No file URL');
			hiddenImage.src = file.url;
		});

		canvas.width = width;
		canvas.height = height;
		context.drawImage(hiddenImage, 0, 0, width, height);
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
		if (!blob) throw new Error('Blob is null');

		return {
			userID: $dbUser?.id,
			url: canvas.toDataURL('image/jpeg'),
			mimeType: 'image/jpeg',
			width: width,
			height: height,
			filesize: blob.size
			// file: canvas.toBlob()
		};
	}

	// Resize image based on preset
	async function resizeImagePreset(file: FileInterface, preset: string) {
		const { width, height } = file;
		if (!width || !height) throw new Error('Media orignal width/height not found');
		const p = resizePresets[preset];
		if (!p) throw new Error('Invalid resize preset');

		const { pixels, long } = p;

		if (pixels) {
			const ratio = Math.sqrt(pixels / (width * height));
			return await resizeImage(file, width * ratio, height * ratio);
		} else if (long) {
			const ratio = long / Math.max(width, height);
			return await resizeImage(file, width * ratio, height * ratio);
		}
	}

	async function resizeOriginal() {
		debug('resizeOriginal', media, resizePreset);

		if (!media.orignal) throw new Error('Original media not found');
		media.resized = await resizeImagePreset(media.orignal, resizePreset);
		media = media;
	}

	let resizedImage: string;

	$: url = media.cropped ? media.cropped.url : media.resized ? media.resized.url : (media.orignal?.url ?? '');
	$: if (hiddenImage) hiddenImage.src = media.orignal?.url ?? '';

	$: debug('url', url);

	$: debug('media', media);
	$: debug('resizedImage', resizedImage);
</script>

<!-- Used for image resizing -->
<canvas bind:this={hiddenCanvas} class="hidden"></canvas>
<img bind:this={hiddenImage} src="" alt="decoy" class="hidden" />

<div class="flex h-[inherit] min-h-0 flex-col items-center">
	<div class="flex">
		{#if titleEdit}
			<input
				type="text"
				class="input input-sm input-bordered"
				bind:value={newTitle}
				on:blur={() => (titleEdit = false)}
				on:keydown={async (e) => {
					debug(e.key);
					if (e.key === 'Enter') {
						media.title = newTitle;
						titleEdit = false;
						await updateMedia(media);
					} else if (e.key === 'Escape') {
						titleEdit = false;
					}
				}} />
		{:else}
			<h2
				class="text-lg font-bold"
				on:dblclick={() => {
					newTitle = media.title ?? '';
					titleEdit = true;
				}}>
				Title: {media.title}
			</h2>
		{/if}

		<div class="flex items-center">
			<p class="label">Resize:</p>
			<select
				class="select select-bordered select-sm"
				bind:value={resizePreset}
				on:change={async () => {
					debug('resizePreset', resizePreset);
					await resizeOriginal();
				}}>
				{#each Object.keys(resizePresets) as preset}
					<option value={preset}>{resizePresets[preset].label}</option>
				{/each}
			</select>
			{#if resizePreset === 'custom'}
				<input type="number" class="input input-sm input-bordered" placeholder="Width" />
				<input type="number" class="input input-sm input-bordered" placeholder="Height" />
			{/if}
		</div>
	</div>
	<!-- <div class="flex gap-2">
        <h2 class="text-lg font-bold">{media.title}</h2>
        <button class="btn btn-sm btn-outline" on:click={() => (titleEdit = !titleEdit)}>Edit</button>
    </div> -->
	<img
		bind:this={image}
		src={url}
		alt={media.title}
		class="pixelated h-full min-h-0 w-full shrink bg-gray-600 object-contain" />
	<div class="flex gap-2">
		<p>File: {media.filename}</p>
		<!-- <p>Width: {media.origWidth}</p>
		<p>Height: {media.origHeight}</p>
		<p>Size: {media.filesize}</p>
		<p>Type: {media.mimeType}</p> -->
	</div>
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
	.pixelated {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		-ms-interpolation-mode: nearest-neighbor;
	}
</style>
