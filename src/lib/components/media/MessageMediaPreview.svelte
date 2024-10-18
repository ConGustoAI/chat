<script lang="ts">
	import { APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { RefreshCcw, RefreshCcwIcon, RefreshCwOff, X } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import DeleteButton from '../DeleteButton.svelte';
	const debug = dbg('app:ui:components:MessageMediaPreview');

	let { media = $bindable(), message = $bindable() }: { media: MediaInterface; message: MessageInterface } = $props();

	let progressBar: HTMLProgressElement | null = $state(null);

	let isHovered = $state(false);

	let thumbnailURL: string | undefined = $state();
	let mediaWidth: number | undefined = $state();
	let mediaHeight: number | undefined = $state();

	$effect(() => {
		if (media.thumbnail?.url) {
			thumbnailURL = media.thumbnail.url;
			debug('thumbnailURL: Picking thumbnail:', $state.snapshot(thumbnailURL));
		} else if (media.original?.file) {
			thumbnailURL = media.original.url;
			debug('thumbnailURL: Picking original:', $state.snapshot(thumbnailURL));
		} else {
			debug('thumbnailURL: No preview URL available');
			thumbnailURL = undefined;
		}

		if (media.resizedWidth != undefined) {
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

	let uploadProgress = $derived.by(() => {
		let totalSize = 0;
		let totalProgress = 0;

		if (media.original?.status === 'progress') {
			totalSize += media.original.size ?? 0;
			totalProgress += ((media.original.uploadProgress ?? 0) * (media.original.size ?? 0)) / 100;
		}

		if (media.thumbnail?.status === 'progress') {
			totalSize += media.thumbnail.size ?? 0;
			totalProgress += ((media.thumbnail.uploadProgress ?? 0) * (media.thumbnail.size ?? 0)) / 100;
		}

		if (totalSize) {
			return (totalProgress / totalSize) * 100;
		} else {
			return undefined;
		}
	});

	async function unlinkMedia() {
		assert(message);

		const index = message?.media?.findIndex((m) => m === media);
		if (index !== -1 && index !== undefined) {
			message.media?.splice(index, 1);
			if (media.id && message.mediaIDs) {
				const idIndex = message.mediaIDs.indexOf(media.id);
				if (idIndex !== -1) {
					message.mediaIDs.splice(idIndex, 1);
					Object.assign(message, await APIupsertMessage(message));
				}
			}
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative flex h-full w-full flex-col justify-between gap-0.5 rounded-md bg-base-300 p-1"
	class:opacity-50={!media.active}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}>
	{#if media.type === 'video'}
		<!-- svelte-ignore a11y_media_has_caption -->
		<!-- <video
			class="grow object-cover"
			onmousemove={(event) => handleVideoSeek(event)}
			onmouseleave={handleVideoStop}
			ontimeupdate={updateProgressBar}> -->
		<!-- <source src={URL.createObjectURL(media.url)} type={media.mimeType} /> -->
		Your browser does not support the video tag.
		<!-- </video> -->
		<progress
			bind:this={progressBar}
			class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
			value={0}
			max={100}></progress>
	{:else if media.type === 'audio'}
		TODO: Audio
	{:else}
		<div class="flex h-full w-full flex-col overflow-hidden bg-base-100">
			<img src={thumbnailURL} alt={media.filename} class="bg-checkered mx-auto overflow-hidden object-contain" />
		</div>

		<div class="mx-1 w-full shrink-0 truncate text-nowrap text-sm">{media.title}</div>

		{#if uploadProgress !== undefined}
			<progress class="progress-success absolute h-full w-full -rotate-90 opacity-50" value={uploadProgress} max={100}
			></progress>
		{/if}

		{#if isHovered}
			<div
				class="absolute right-0 top-0 flex items-start gap-1 rounded-md bg-primary bg-opacity-30 p-1"
				transition:fade={{ duration: 100 }}>
				{#if !A.dbUser || A.dbUser.hacker}
					<label
						class="swap swap-rotate btn-xs z-40 p-0.5"
						title={media.repeat ? 'Send the image for every chat turn' : 'Send the image once'}>
						<input type="checkbox" class="" bind:checked={media.repeat} />
						<RefreshCcwIcon class="swap-on" size="fit-h" />
						<RefreshCwOff class="swap-off " size="fit-h" />
					</label>
				{/if}
			</div>
			{#if message.editing}
				<div class="absolute left-0 top-0 size-full p-6">
					<button class="rounded-md bg-black bg-opacity-50 text-error" onclick={unlinkMedia}>
						<X size="fit-h" />
					</button>
				</div>
			{/if}
		{/if}
	{/if}
</div>
