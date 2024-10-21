<script lang="ts">
	import { APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';
	import dbg from 'debug';
	import { RefreshCcwIcon, RefreshCwOff, X, Edit, Eye } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	const debug = dbg('app:ui:components:MessageMediaPreview');

	let { media = $bindable(), message = $bindable() }: { media: MediaInterface; message: MessageInterface } = $props();

	let isHovered = $state(false);

	// let thumbnailURL: string | undefined = $state();
	let mediaWidth: number | undefined = $state();
	let mediaHeight: number | undefined = $state();

	// 	if (media.thumbnail?.url) {
	// 		thumbnailURL = media.thumbnail.url;
	// 		debug('thumbnailURL: Picking thumbnail:', $state.snapshot(thumbnailURL));
	// 	} else if (media.original?.file) {
	// 		thumbnailURL = media.original.url;
	// 		debug('thumbnailURL: Picking original:', $state.snapshot(thumbnailURL));
	// 	} else {
	// 		debug('thumbnailURL: No preview URL available');
	// 		thumbnailURL = undefined;
	// 	}

	$effect(() => {
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

	let thumbnailURL = $derived.by(() => {
		if (media?.thumbnail?.url) {
			debug('thumbnailURL: Picking thumbnail');
			return media.thumbnail.url;
		} else if (media?.original?.file) {
			debug('thumbnailURL: Picking original');
			return media.original.url;
		} else {
			debug('thumbnailURL: No preview URL available');
			return undefined;
		}
	});

	let thumbnailText = $derived.by(() => {
		if (media?.thumbnail?.text) {
			debug('thumbnailText: Picking thumbnail');
			return media.thumbnail.text;
		} else if (media?.original?.text) {
			debug('thumbnailText: Picking original');
			return media.original.text;
		} else {
			debug('thumbnailText: No preview text available');
			return undefined;
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
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="relative flex h-full w-full flex-col justify-between gap-0.5 rounded-md bg-base-300 p-1"
	class:opacity-50={!media.active}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}>
	<div class="flex h-full w-full flex-col overflow-hidden bg-base-100">
		{#if media.type === 'image'}
			<img src={thumbnailURL} alt={media.filename} class="bg-checkered mx-auto overflow-hidden object-contain" />
		{:else if media.type === 'text'}
			<p class="m-0 line-clamp-3 overflow-hidden break-words text-sm">
				{thumbnailText ?? ''}
			</p>
		{/if}
	</div>

	<div class="mx-1 flex w-full shrink-0 flex-col items-center text-nowrap text-center text-sm" title={media.title}>
		{#if isHovered}
			<div class="z-20 overflow-visible bg-base-300">
				{media.title}
			</div>
		{:else}
			<p class="mx-1 w-full shrink-0 truncate">{media.title}</p>
		{/if}
	</div>

	<!-- <div class="mx-1 w-full shrink-0 truncate text-nowrap text-sm">{media.title}</div> -->

	{#if uploadProgress !== undefined}
		<progress class="progress-success absolute h-full w-full -rotate-90 opacity-50" value={uploadProgress} max={100}
		></progress>
	{/if}
	<!-- {/if} -->

	{#if isHovered}
		{#if !isPublicPage()}
			<div
				class="absolute right-0 top-0 flex items-start gap-1 rounded-md bg-primary bg-opacity-30 p-1"
				transition:fade={{ duration: 100 }}>
				{#if !A.dbUser || A.dbUser.hacker}
					<label
						class="swap swap-rotate btn-xs z-40 p-0.5"
						title={media.repeat ? 'Send the file for every chat turn' : 'Send the file once'}>
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
			{:else}
				<div class="absolute left-0 top-0 size-full p-8">
					<button
						class="rounded-md bg-black bg-opacity-50"
						onclick={() => {
							if (A.mediaEditing) {
								A.mediaEditing = undefined;
							} else {
								A.mediaEditing = media;
							}
						}}>
						<Edit size="fit-h" />
					</button>
				</div>
			{/if}
		{:else}
			<div class="absolute left-0 top-0 size-full p-8">
				<button
					class="rounded-md bg-black bg-opacity-50"
					onclick={() => {
						if (A.mediaEditing) {
							A.mediaEditing = undefined;
						} else {
							A.mediaEditing = media;
						}
					}}>
					<Eye size="fit-h" />
				</button>
			</div>
		{/if}
	{/if}
</div>
