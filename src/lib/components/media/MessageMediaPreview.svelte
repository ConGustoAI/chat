<script lang="ts">
	import { APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { RefreshCcw, RefreshCwOff, X } from 'lucide-svelte';
	const debug = dbg('app:ui:components:MessageMediaPreview');

	let { media = $bindable(), message = $bindable() }: { media: MediaInterface; message: MessageInterface } = $props();

	let progressBar: HTMLProgressElement | null = $state(null);

	let isHovered = $state(false);

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

	$inspect(thumbnailURL).with((t, u) => debug('thumbnailURL', t, u));

	async function unlinnkMedia() {
		assert(message);
		assert(media.id);
		// const deleted = A.conversation.media.splice(A.conversation.media.indexOf(media), 1);

		const index = message?.mediaIDs?.indexOf(media.id);
		if (index !== -1 && index !== undefined) {
			message.mediaIDs?.splice(index, 1);
			Object.assign(message, await APIupsertMessage(message));
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
	{/if}

	<!-- <div class="absolute -right-2 -top-2 z-30 flex items-start gap-1 overflow-hidden rounded-md bg-primary p-1">
		{#if !A.dbUser || A.dbUser.hacker}
			<label class="btn swap swap-rotate btn-xs bg-black bg-opacity-70 p-0.5 hover:bg-opacity-100">
				<input type="checkbox" class="" bind:checked={media.repeat} />
				<RefreshCcw class="swap-on " size="fit-h" />
				<RefreshCwOff class="swap-off " size="fit-h" />
			</label>
		{/if}
		<button class="btn btn-xs p-0.5 text-error" onclick={unlinnkMedia}><X size="fit-h" /></button>
	</div> -->
</div>
