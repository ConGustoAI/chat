<script lang="ts">
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { RefreshCcw, RefreshCwOff } from 'lucide-svelte';
	import { untrack } from 'svelte';
	const debug = dbg('app:ui:components:MediaPreview');

	let { media = $bindable() }: { media: MediaInterface } = $props();

	let progressBar: HTMLProgressElement | null = $state(null);

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

	$effect(() => debug('media: ', $state.snapshot(media)));

	// $inspect(media).with((t, c) => {
	// 	debug('media', t, c);
	// });

	let isHovered = false;

	let thumbnailURL: string | undefined = $state();
	let mediaWidth: number | undefined = $state();
	let mediaHeight: number | undefined = $state();

	$effect(() => {
		if (media.thumbnail?.url) {
			debug('thumbnailURL: Picking thumbnail');
			thumbnailURL = media.thumbnail.url;
		} else if (media.original?.file) {
			debug('thumbnailURL: Picking original');
			thumbnailURL = media.original.url;
		} else {
			debug('thumbnailURL: No preview URL available');
			thumbnailURL = undefined;
		}

		if (media.newResizedWidth != undefined) {
			assert(media.newResizedHeight != undefined);
			mediaHeight = media.newResizedHeight;
			mediaWidth = media.newResizedWidth;
		} else if (media.resizedWidth != undefined) {
			assert(media.resizedHeight != undefined);
			mediaWidth = media.resizedWidth;
			mediaHeight = media.resizedHeight;
		} else if (media.originalWidth != undefined) {
			assert(media.originalWidth != undefined);
			mediaWidth = media.originalWidth;
			mediaHeight = media.originalHeight;
		} else {
			mediaWidth = undefined;
			mediaHeight = undefined;
		}
	});

	$inspect(thumbnailURL).with((t, u) => debug('thumbnailURL', t, u));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative flex h-32 w-32 flex-col gap-0.5 justify-between p-1 bg-base-300 rounded-md"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}>
	{#if media.type === 'video'}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			class="grow object-cover"
			onmousemove={(event) => handleVideoSeek(event)}
			onmouseleave={handleVideoStop}
			ontimeupdate={updateProgressBar}>
			<!-- <source src={URL.createObjectURL(media.url)} type={media.mimeType} /> -->
			Your browser does not support the video tag.
		</video>
		<progress
			bind:this={progressBar}
			class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
			value={0}
			max={100}></progress>
	{:else if media.type === 'audio'}
		TODO: Audio
	{:else}
		<img src={thumbnailURL} alt={media.filename} class="h-auto max-h-full w-full overflow-hidden object-contain" />

		<div class="mx-1 w-full shrink-0 truncate text-nowrap text-sm">{media.title}</div>

		<div class="absolute bottom-1 w-full bg-blue-500">
			{#if media.original?.status === 'progress'}
				<progress class="progress progress-success" value={media.original.uploadProgress} max={100}>
					{media.original.uploadProgress}%
				</progress>
			{:else if media.original?.status === 'failed'}
				<p class=" text-xs text-error">Upload error: {media.original.uploadError}</p>
			{/if}
			{#if media.resized?.status === 'progress'}
				<progress class="progress progress-success" value={media.resized?.uploadProgress} max={100}>
					{media.resized?.uploadProgress}%
				</progress>
			{:else if media.resized?.status === 'failed'}
				<p class=" text-xs text-error">Upload error: {media.resized?.uploadError}</p>
			{/if}
			{#if media.thumbnail?.status === 'progress'}
				<progress class="progress progress-success" value={media.thumbnail?.uploadProgress} max={100}>
					{media.thumbnail?.uploadProgress}%
				</progress>
			{:else if media.thumbnail?.status === 'failed'}
				<p class=" text-xs text-error">Upload error: {media.thumbnail?.uploadError}</p>
			{/if}
		</div>
	{/if}

	<label class="swap swap-rotate absolute right-1 top-1 z-30">
		<input type="checkbox" class="" bind:checked={media.repeat} />
		<RefreshCcw class="swap-on" />
		<RefreshCwOff class="swap-off" />
	</label>

	{#if media.originalWidth != undefined}
		<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
			{media.originalWidth}x{media.originalHeight}
			{#if media.newResizedWidth != undefined || media.resizedWidth != undefined}
				<p>↓</p>
				{media.newResizedWidth ?? media.resizedWidth}x{media.newResizedHeight ?? media.resizedHeight}
			{/if}
		</div>
	{/if}
</div>
