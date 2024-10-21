<script lang="ts">
	import { APIdeleteMedia, APIupsertConversation, APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { DeleteButton } from '$lib/components';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { Edit, RefreshCcwIcon, RefreshCwOff, Upload, Plus } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	const debug = dbg('app:ui:components:ConversatoinMediaPreview');

	let { media = $bindable(), message = $bindable() }: { media: MediaInterface; message?: MessageInterface } = $props();

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

	let isHovered = $state(false);

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

	let fullyUploaded = $derived.by(() => {
		return (!media.original || media.original.status === 'ok') && (!media.thumbnail || media.thumbnail.status === 'ok');
	});

	async function deleteMedia() {
		assert(A.conversation);
		assert(A.conversation.media);

		const mediaIdx = A.conversation.media.indexOf(media);
		assert(mediaIdx !== -1);

		const promises = [];

		if (media.id) {
			for (const message of A.conversation.messages ?? []) {
				if (message.mediaIDs?.includes(media.id)) {
					const idx = message.mediaIDs.indexOf(media.id);
					if (idx !== -1) {
						message.mediaIDs.splice(idx, 1);
						promises.push(APIupsertMessage(message));
					}
				}
			}
			promises.push(APIupsertConversation(A.conversation));
			promises.push(APIdeleteMedia(media.id));
		}

		await Promise.all(promises);
		if (media.original?.url) URL.revokeObjectURL(media.original.url);
		if (media.thumbnail?.url) URL.revokeObjectURL(media.thumbnail.url);

		A.conversation.media.splice(A.conversation.media.indexOf(media), 1);
	}

	async function addMediaToMessage() {
		assert(message);
		debug('addMediaToMessage', $state.snapshot({ message, media }));

		if (!message.mediaIDs) message.mediaIDs = [];
		if (!message.media) message.media = [];
		assert(!message.media.includes(media));

		message.media.push(media);
		if (media.id && !message.mediaIDs.includes(media.id)) {
			if (media.id) {
				message.mediaIDs.push(media.id);
				await APIupsertMessage(message);
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
	<!-- {#if media.type === 'video'} -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<!-- <source src={URL.createObjectURL(media.url)} type={media.mimeType} /> -->
	<!-- <video
			class="grow object-cover"
			onmousemove={(event) => handleVideoSeek(event)}
			onmouseleave={handleVideoStop}
			ontimeupdate={updateProgressBar}>
			Your browser does not support the video tag.
		</video>
		<progress
			bind:this={progressBar}
			class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
			value={0}
			max={100}></progress> -->
	<!-- {:else if media.type === 'audio'}
		TODO: Audio
	{:else} -->
	<div class="relative flex h-full w-full flex-col overflow-hidden bg-base-100">
		{#if media.type === 'image' || media.type === 'pdf'}
			<img
				src={thumbnailURL}
				alt={media.filename}
				class="pixilated bg-checkered mx-auto overflow-hidden object-contain" />

			<div class="absolute bottom-1 mr-2 flex h-fit w-full flex-col gap-0.5">
				{#if media.original?.status === 'progress'}
					<progress class="progress progress-success h-1 rounded-none" value={media.original.uploadProgress} max={100}>
						{media.original.uploadProgress}%
					</progress>
				{:else if media.original?.status === 'failed'}
					<p class=" text-xs text-error">Upload error: {media.original.uploadError}</p>
				{/if}
				{#if media.resized?.status === 'progress'}
					<progress class="progress progress-success h-1 rounded-none" value={media.resized?.uploadProgress} max={100}>
						{media.resized?.uploadProgress}%
					</progress>
				{:else if media.resized?.status === 'failed'}
					<p class=" text-xs text-error">Upload error: {media.resized?.uploadError}</p>
				{/if}
				{#if media.thumbnail?.status === 'progress'}
					<progress
						class="progress progress-success h-1 rounded-none"
						value={media.thumbnail?.uploadProgress}
						max={100}>
						{media.thumbnail?.uploadProgress}%
					</progress>
				{:else if media.thumbnail?.status === 'failed'}
					<p class=" text-xs text-error">Upload error: {media.thumbnail?.uploadError}</p>
				{/if}
			</div>

			{#if media.originalWidth != undefined}
				<div
					class="absolute bottom-0 right-0 rounded-none bg-black bg-opacity-50 px-1 text-center text-sm text-primary-content">
					{media.originalWidth}x{media.originalHeight}
					{#if media.resizedWidth != undefined}
						<span>↓</span>
						{media.resizedWidth}x{media.resizedHeight}
					{/if}
				</div>
			{/if}
		{:else if media.type === 'text'}
			<p class="m-0 line-clamp-5 h-full w-full overflow-hidden break-words text-sm">
				{thumbnailText ?? ''}
			</p>
		{:else}
			<div class="flex flex-grow items-center justify-center">
				<p class="text-center">Unsupported media type</p>
			</div>
		{/if}

		{#if fullyUploaded}
			<div class="absolute bottom-0.5 left-0 z-30 text-success">
				<Upload size={14} strokeWidth={3} />
			</div>
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
	<!-- {/if} -->

	{#if isHovered}
		<div
			class="absolute -right-2 -top-4 z-10 flex items-start gap-2 rounded-md bg-primary p-1"
			transition:fade={{ duration: 100 }}>
			<!-- <button
				class="btn-xs p-0"
				title="Edit file"
				onclick={() => {
					if (A.mediaEditing === media) {
						A.mediaEditing = undefined;
					} else {
						A.mediaEditing = media;
					}
				}}>
				<Edit size="fit-h" />
			</button> -->

			<DeleteButton
				btnClass="btn-xs p-0 text-error"
				class="dropdown-bottom  text-error "
				deleteAction={deleteMedia}
				title="Delete file" />
			{#if !A.dbUser || A.dbUser.hacker}
				<label
					class="swap swap-rotate btn-xs p-0.5"
					title={media.repeat ? 'Send the file for every chat turn' : 'Send the file once'}>
					<input type="checkbox" class="" bind:checked={media.repeat} />
					<RefreshCcwIcon class="swap-on" size="fit-h" />
					<RefreshCwOff class="swap-off " size="fit-h" />
				</label>
			{/if}
		</div>

		{#if message}
			<div class="absolute left-0 top-0 h-full w-full p-10">
				<button class="bg-black bg-opacity-50 text-success" onclick={addMediaToMessage}>
					<Plus size="fit-h" />
				</button>
			</div>
		{:else}
			<div class="absolute left-0 top-0 size-full p-10">
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
	{/if}
</div>
