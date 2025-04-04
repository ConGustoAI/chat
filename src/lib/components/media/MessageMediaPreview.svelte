<script lang="ts">
	import { APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';
	import dbg from 'debug';
	import { RefreshCcwIcon, RefreshCwOff, X, Edit, Eye, AudioLines, Volume1, Volume2 } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	const debug = dbg('app:ui:components:MessageMediaPreview');

	let { media = $bindable(), message = $bindable() }: { media: MediaInterface; message: MessageInterface } = $props();

	let isHovered = $state(false);

	let thumbnailURL: string | undefined = $state(undefined);
	$effect(() => {
		if (['image', 'pdf', 'video', 'audio'].includes(media.type)) {
			if (media.thumbnail) {
				debug('thumbnailURL: Picking thumbnail');
				// media.thumbnail.then((t) => (thumbnailURL = t.url));
				thumbnailURL = media.thumbnail.url;
			} else if (media.transformed) {
				debug('thumbnailURL: Picking resized');
				media.transformed.then((r) => (thumbnailURL = r.url));
			} else if (media.original) {
				debug('thumbnailURL: Picking original');
				thumbnailURL = media.original.url;
			} else {
				debug('thumbnailURL: No preview URL available');
				thumbnailURL = undefined;
			}
		}
	});

	let thumbnailText: string | undefined = $derived(media.text?.slice(0, 200).trim());

	let uploadProgress: number | undefined = $state(undefined);

	$effect(() => {
		if (!media) {
			uploadProgress = undefined;
			return;
		}

		let totalSize = 0;
		let totalProgress = 0;

		if (media.original && media.original.status === 'progress') {
			totalSize += media.original.size ?? 0;
			totalProgress += ((media.original.uploadProgress ?? 0) * (media.original.size ?? 0)) / 100;
		}

		if (media.thumbnail) {
				const t = media.thumbnail;
				if (t && t.status === 'progress') {
					totalSize += t.size ?? 0;
					totalProgress += ((t.uploadProgress ?? 0) * (t.size ?? 0)) / 100;
				}

				if (totalSize) {
					uploadProgress = (totalProgress / totalSize) * 100;
				} else {
					uploadProgress = undefined;
				}
				debug('media uploadProgress', uploadProgress);

		} else {
			if (totalSize) {
				uploadProgress = (totalProgress / totalSize) * 100;
			} else {
				uploadProgress = undefined;
			}
			debug('media uploadProgress', uploadProgress);
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

	let audioPlayer: HTMLAudioElement | undefined = $state();
	let mediaPlaybackProgressBar: HTMLProgressElement | undefined = $state();
	let isPlaying = $state(false);

	$effect(() => {
		let interval: ReturnType<typeof setInterval>;
		if (isPlaying) {
			interval = setInterval(() => {
				volumeIcon = volumeIcon === 1 ? 2 : 1;
			}, 500); // Switch every second
		}
		return () => clearInterval(interval);
	});

	let volumeIcon = $state(1);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="relative flex h-full w-full flex-col justify-between gap-0.5 rounded-md bg-base-300 p-1"
	class:opacity-50={!media.active && !isPublicPage()}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}>
	<div class="flex h-full w-full flex-col overflow-hidden bg-base-100">
		{#if media.type === 'image' || media.type === 'video'}
			<img
				src={thumbnailURL}
				alt={media.filename}
				class="pixilated bg-checkered mx-auto h-full w-full overflow-hidden object-contain" />
		{:else if media.type === 'audio'}
			<div class=" flex h-full w-full flex-col">
				<button
					class="z-20"
					onclick={() => {
						debug('Playing audio');
						if (audioPlayer?.paused) audioPlayer.play();
						else audioPlayer?.pause();
					}}>
					{#if !isPlaying}
						<AudioLines />
					{:else}
						<div in:fade={{ duration: 200 }}>
							{#if volumeIcon === 1}
								<Volume1 />
							{:else}
								<Volume2 />
							{/if}
						</div>
					{/if}
				</button>
				<audio
					class="h-full w-full grow"
					bind:this={audioPlayer}
					onplay={() => {
						isPlaying = true;
					}}
					onpause={() => {
						isPlaying = false;
					}}
					onended={() => {
						isPlaying = false;
					}}>
					<source src={thumbnailURL} />
				</audio>
				<progress
					bind:this={mediaPlaybackProgressBar}
					class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
					value="0"
					max={100}></progress>
			</div>
		{:else if media.type === 'pdf'}
			<img src={thumbnailURL} alt={media.filename} class="mx-auto h-full w-full overflow-hidden object-contain" />
		{:else if media.type === 'text'}
			<pre class="tab-size-2 m-0 line-clamp-3 overflow-hidden text-sm">{thumbnailText ?? ''}</pre>
		{/if}
	</div>

	<div class="mx-1 flex w-full shrink-0 flex-col items-start text-nowrap text-sm" title={media.title}>
		{#if isHovered}
			<div class="z-20 overflow-visible bg-base-300 border px-1 rounded-md">
				{media.title}
			</div>
		{:else}
			<p class="mx-1 w-full shrink-0 truncate border border-transparent">{media.title}</p>
		{/if}
	</div>

	<!-- <div class="mx-1 w-full shrink-0 truncate text-nowrap text-sm">{media.title}</div> -->

	{#if uploadProgress !== undefined}
		<progress class="progress-success absolute h-full w-full -rotate-90 opacity-50" value={uploadProgress} max={100}
		></progress>
	{/if}

	{#if media.processing}
		<div class="loading absolute left-1 top-1 m-auto"></div>
	{/if}
	<!-- {/if} -->

	{#if isHovered}
		{#if !isPublicPage()}
			<div
				class="absolute right-0 top-0 flex items-start gap-1 rounded-md bg-primary bg-opacity-30 p-1"
				transition:fade={{ duration: 100 }}>
				{#if !A.user || A.user.hacker}
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
