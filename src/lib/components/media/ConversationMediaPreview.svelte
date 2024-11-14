<script lang="ts">
	import { APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { DeleteButton } from '$lib/components';
	import { assistantSupportsMedia, deleteMedia } from '$lib/utils/media_utils.svelte';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import {
		AlertTriangle,
		AudioLines,
		Edit,
		Plus,
		RefreshCcwIcon,
		RefreshCwOff,
		Upload,
		Volume1,
		Volume2
	} from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	const debug = dbg('app:ui:components:ConversatoinMediaPreview');

	let { media = $bindable(), message = $bindable() }: { media: MediaInterface; message?: MessageInterface } = $props();

	let mediaPlaybackProgressBar: HTMLProgressElement | null = $state(null);

	let audioPlayer: HTMLAudioElement | null = $state(null);
	let isPlaying = $state(false);

	// Handle video seek based on mouse position
	function handleVideoSeek(event: MouseEvent) {
		debug('handleVideoSeek');
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
		debug('handleVideoStop');
		const video = event.currentTarget as HTMLVideoElement;
		video.pause();
	}

	// Update progress bar based on video time
	function updateProgressBar(event: Event) {
		debug('updateProgressBar');
		const video = event.currentTarget as HTMLVideoElement;
		if (mediaPlaybackProgressBar && video.duration) {
			const percentage = (video.currentTime / video.duration) * 100;
			mediaPlaybackProgressBar.value = percentage;
		}
	}

	// svelte-ignore state_snapshot_uncloneable
	$effect(() => debug('media: ', $state.snapshot(media)));

	let isHovered = $state(false);

	let thumbnailURL: string | undefined = $state(undefined);

	$effect(() => {
		if (['image', 'pdf', 'video', 'audio'].includes(media.type)) {
			if (media.thumbnail) {
				debug('thumbnailURL: Picking thumbnail');
				thumbnailURL = media.thumbnail.url;
				// media.thumbnail.then((t) => (thumbnailURL = t.url));
			} else if (media.transformed) {
				debug('thumbnailURL: Picking transformed');
				media.transformed.then((r) => (thumbnailURL = r.url));
			} else if (media.original && ['image', 'video', 'audio'].includes(media.type)) {
				debug('thumbnailURL: Picking original');
				thumbnailURL = media.original.url;
			} else {
				debug('thumbnailURL: No preview URL available');
				thumbnailURL = undefined;
			}
		}
	});

	let thumbnailText: string | undefined = $derived(media.text?.slice(0, 200).trim());

	let numWords: number | undefined = $derived.by(() => {
		if (media.text) return media.text.split(/\s+/).length;
	});

	let numLines: number | undefined = $derived.by(() => {
		if (media.text) return media.text.split(/\n/).length;
	});

	$effect(() => {
		if (audioPlayer) {
			audioPlayer.addEventListener('play', () => (isPlaying = true));
			audioPlayer.addEventListener('pause', () => (isPlaying = false));
			audioPlayer.addEventListener('ended', () => (isPlaying = false));

			return () => {
				audioPlayer?.removeEventListener('play', () => (isPlaying = true));
				audioPlayer?.removeEventListener('pause', () => (isPlaying = false));
				audioPlayer?.removeEventListener('ended', () => (isPlaying = false));
			};
		}
	});

	let volumeIcon = $state(1);

	$effect(() => {
		let interval: ReturnType<typeof setInterval>;
		if (isPlaying) {
			interval = setInterval(() => {
				volumeIcon = volumeIcon === 1 ? 2 : 1;
			}, 500); // Switch every second
		}
		return () => clearInterval(interval);
	});

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

	let mediaSupported = $derived.by(() => {
		if (!A.conversation?.assistantID) return true;
		const assistant = A.assistants[A.conversation.assistantID];
		if (!assistant) return true; // Assume supported if assistant is not loaded

		return assistantSupportsMedia(assistant, media);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative flex h-full w-full flex-col justify-between gap-0.5 rounded-md bg-base-300 p-1"
	draggable="false"
	class:opacity-50={!media.active}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}>
	<!-- {:else if media.type === 'audio'}
		TODO: Audio
	{:else} -->
	<div class="relative flex h-full w-full flex-col overflow-hidden bg-base-100">
		{#if media.type === 'image'}
			<img
				src={thumbnailURL}
				alt={media.filename}
				draggable="false"
				class="pixilated bg-checkered mx-auto h-full w-full overflow-hidden object-contain" />

			{#if media.originalWidth != undefined}
				<div
					class="absolute bottom-0 right-0 rounded-none bg-black bg-opacity-50 px-1 text-center text-sm text-primary-content">
					{media.originalWidth}x{media.originalHeight}
					{#if media.transformed}
						<span>↓</span>
						{media.resizedWidth}x{media.resizedHeight}
					{/if}
				</div>
			{/if}
		{:else if media.type === 'video'}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				class="grow object-cover"
				onmousemove={(event) => handleVideoSeek(event)}
				onmouseleave={handleVideoStop}
				ontimeupdate={updateProgressBar}>
				Your browser does not support the video tag.
				<source src={thumbnailURL} type={media.original.mimeType} />
			</video>
			<progress
				bind:this={mediaPlaybackProgressBar}
				class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
				value="0"
				max={100}></progress>
		{:else if media.type === 'audio'}
			<div class="flex h-full w-full flex-col">
				<button
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
				<audio class="h-full w-full grow" bind:this={audioPlayer}>
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
			<pre class="tab-size-2 m-0 line-clamp-5 overflow-hidden text-sm">{thumbnailText ?? ''}</pre>
			<div
				class="absolute bottom-0 right-0 rounded-none bg-black bg-opacity-50 px-1 text-end text-sm text-primary-content">
				<p>
					{#if numWords != undefined}
						W: {numWords}
					{/if}
					{#if numLines != undefined}
						L: {numLines}
					{/if}
				</p>
			</div>
		{:else}
			<div class="flex flex-grow items-center justify-center">
				<p class="text-center">Unsupported media type</p>
			</div>
		{/if}

		{#if !(mediaSupported === true)}
			<div class="pointer-events-none absolute left-0 top-0 size-full p-5">
				<div class="pointer-events-auto rounded-md bg-black bg-opacity-50 text-error">
					<AlertTriangle size="fit-h" />
				</div>
			</div>
		{/if}

		<div class="absolute bottom-1 mr-2 flex h-fit w-full flex-col gap-0.5">
			{#if media.original?.status === 'progress'}
				<progress class="progress progress-success h-1 rounded-none" value={media.original.uploadProgress} max={100}>
					{media.original.uploadProgress}%
				</progress>
			{:else if media.original?.status === 'failed'}
				<p class=" text-xs text-error">Upload error: {media.original.uploadError}</p>
			{/if}

			{#if media.thumbnail}
				{#await media.thumbnail}
					<div class="loading m-auto"></div>
				{:then thumbnail}
					{#if thumbnail.status === 'progress'}
						<progress class="progress progress-success h-1 rounded-none" value={thumbnail.uploadProgress} max={100}>
							{thumbnail.uploadProgress}%
						</progress>
					{:else if thumbnail.status === 'failed'}
						<p class=" text-xs text-error">Upload error: {thumbnail?.uploadError}</p>
					{/if}
				{/await}
			{/if}
		</div>

		<!-- {#await media.thumbnail then thumbnail} -->
			{#if (!media.original || media.original.status === 'ok') && (!media.thumbnail || media.thumbnail.status === 'ok')}
				<div class="absolute bottom-0.5 left-0 z-30 text-success">
					<Upload size={14} strokeWidth={3} />
				</div>
			{/if}
		<!-- {/await} -->
	</div>

	<div class="mx-1 flex w-full shrink-0 flex-col items-start text-nowrap text-sm" title={media.title}>
		{#if isHovered}
			<div class="z-20 overflow-visible bg-base-300 px-1 border rounded-md">
				{media.title}
			</div>
		{:else}
			<p class="mx-1 w-full shrink-0 truncate border border-transparent">{media.title}</p>
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
				deleteAction={async () => await deleteMedia(media)}
				title="Delete file" />
			{#if !A.user || A.user.hacker}
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
			<div class="pointer-events-none absolute left-0 top-0 h-full w-full p-10">
				<button class="pointer-events-auto bg-black bg-opacity-50 text-success" onclick={addMediaToMessage}>
					<Plus size="fit-h" />
				</button>
			</div>
		{:else}
			<div class="pointer-events-none absolute left-0 top-0 size-full p-10">
				<button
					class="pointer-events-auto rounded-md bg-black bg-opacity-50"
					onclick={() => {
						if (A.mediaEditing) {
							A.mediaEditing = undefined;
						} else {
							debug('Setting A.mediaEditing: ', $state.snapshot(media));
							A.mediaEditing = media;
						}
					}}>
					<Edit size="fit-h" />
				</button>
			</div>
		{/if}
	{/if}
</div>
