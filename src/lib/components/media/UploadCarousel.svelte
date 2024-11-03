<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { PlusCircle, Upload } from 'lucide-svelte';
	import { ConversationMediaPreview } from '.';

	import { goto } from '$app/navigation';
	import { fileToMedia, syncMedia, uploadConversationMedia } from '$lib/utils/media_utils.svelte';

	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:UploadCarousel');

	let { message = $bindable() }: { message?: MessageInterface } = $props();

	// Handle file input change
	function handleFileChange(event: Event) {
		if (!A.conversation) throw new Error('Conversation missing');

		const input = event.target as HTMLInputElement;

		debug('input.files', input.files);
		if (input.files) {
			if (!A.conversation.media) A.conversation.media = [];

			const newFiles = Array.from(input.files).filter(
				(file) =>
					// Check if the file has already been uploaded by comparing size, last modified date, and name
					!A.conversation?.media?.some(
						(m) =>
							m.original?.size === file.size &&
							m.original?.file?.lastModified === file.lastModified &&
							m.filename === file.name
					)
			);

			const newMedia = newFiles.map(fileToMedia);

			A.conversation.media.push(...newMedia);

			A.conversation.media.map(syncMedia);

			// svelte-ignore state_snapshot_uncloneable
			debug('Files added to conversation: ', $state.snapshot(A.conversation));
			input.value = '';
		}
	}

	let meidaNeedsUpload = $state(false);

	$effect(() => {
		meidaNeedsUpload = !!A.conversation?.media?.find(
			async (m) => (m.original && m.original.status !== 'ok') || (m.thumbnail && (await m.thumbnail).status !== 'ok')
		);
	});

	let totalUploadProgress: number | undefined = $state(undefined);

	$effect(() => {
		if (!A.conversation?.media) {
			totalUploadProgress = undefined;
			return;
		}

		Promise.all(
			A.conversation.media.map(async (m) => {
				let p = 0;
				let count = 0;
				if (m.original && m.original.status === 'progress') {
					p += m.original.uploadProgress ?? 0;
					count++;
				}
				const thumbnail = await m.thumbnail;
				if (thumbnail && thumbnail.status === 'progress') {
					p += thumbnail.uploadProgress ?? 0;
					count++;
				}
				return count ? p / count : undefined;
			})
		).then((progress) => {
			const p = progress.filter((p) => p !== undefined) as number[];
			if (p.length) {
				const calculatedProgress = p.reduce((a, b) => a + b, 0) / p.length;
				totalUploadProgress = calculatedProgress;
				debug('totalUploadProgress', calculatedProgress);
			} else {
				totalUploadProgress = undefined;
			}
		});
	});
</script>

<div class="no-drag flex shrink-0 flex-col overflow-hidden">
	<!-- + (A.mediaEditing && A.conversation?.media?.includes(A.mediaEditing) ? ' h-[66dvh]' : '')}> -->
	<!-- The message editing area should appear on the bottom when the carousel is invoked from inside a message -->
	<!-- {#if A.mediaEditing && !message && A.conversation?.media?.includes(A.mediaEditing)}
		<MediaEditor bind:media={A.mediaEditing} />
		<div class="divider w-full"></div>
	{/if} -->

	<div
		class="carousel carousel-center h-fit w-full shrink-0 space-x-4 p-4"
		role="region"
		aria-label="Image upload area">
		<!-- Clickable box for file upload -->

		<div class="flex flex-col gap-3">
			<button
				class="btn carousel-item btn-outline relative h-14 w-14 items-center justify-center rounded-sm p-0"
				onclick={() => document.getElementById('fileInput')?.click()}>
				<PlusCircle size={32} />
				{#if A.debug}
					<p class="absolute bottom-1 right-1 text-debug">{A.mediaProcessing ?? 0}</p>
				{/if}
			</button>

			<button
				class="btn btn-disabled carousel-item btn-outline relative h-14 w-14 items-center justify-center rounded-sm p-0"
				class:btn-disabled={!meidaNeedsUpload || totalUploadProgress !== undefined}
				disabled={!meidaNeedsUpload || totalUploadProgress !== undefined}
				onclick={async () => {
					const newConversation = await uploadConversationMedia();
					if (newConversation) {
						assert(A.conversation?.id);
						goto(`/chat/${A.conversation?.id}`);
					}
				}}>
				{#if totalUploadProgress !== undefined}
					<progress
						class="progress-success absolute h-full w-full -rotate-90 opacity-50"
						value={totalUploadProgress}
						max={100}></progress>
				{/if}
				<Upload size={32} />
				{#if A.debug}
					<p class="absolute bottom-1 right-1 text-debug">{A.mediaUploading ?? 0}</p>
				{/if}
			</button>
		</div>
		<!-- Hidden file input -->
		<input id="fileInput" type="file" class="hidden" onchange={handleFileChange} multiple />

		<!-- Display uploaded images or videos -->
		{#if A.conversation?.media}
			{#each A.conversation?.media as m, i}
				{#if !message || !message.media?.includes(m)}
					<div class="carousel-item flex h-32 w-32 flex-col">
						<ConversationMediaPreview bind:media={A.conversation.media[i]} bind:message />
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- {#if A.mediaEditing && message}
		<MediaEditor bind:media={A.mediaEditing} />
		<div class="divider w-full"></div>
	{/if} -->
</div>
