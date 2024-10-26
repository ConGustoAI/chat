<script lang="ts">
	import { APIupsertMedia } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { PDFToImages } from '$lib/utils/pdf.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';
	import dbg from 'debug';
	import { untrack } from 'svelte';
	import InfoPopup from '../InfoPopup.svelte';
	import { addImageToSkip, removeImageFromSkip } from '$lib/utils/media_utils.svelte';
	import { videoToImages } from '$lib/utils/video.svelte';
	const debug = dbg('app:ui:components:MediaVideoControls');

	// let DPISelector: HTMLSelectElement | null = $state(null);
	let processingImages = $state(false);

	async function handleVideoAsImages() {
		// assert(DPISelector);
		assert(A.mediaEditing);
		assert(A.mediaEditing.original);
		// debug('handlePdfAsImages', DPISelector.value);
		processingImages = true;

		try {
			// A.mediaEditing.PDFAsImagesDPI = parseInt(DPISelector.value);
			const newImages = await videoToImages(A.mediaEditing);

			// Here we await the promises, so they are fully resolved when the page is rendered.
			// This avoids flicker, as otherwise there would be a short period of no images displayed
			/// while the promises resolve.
			await Promise.all(newImages);
			A.mediaEditing.videoImages = newImages;
			Object.assign(A.mediaEditing, await APIupsertMedia(A.mediaEditing));
		} finally {
			processingImages = false;
		}
	}

	$effect(() => {
		if (A.mediaEditing?.videoAsImages && !A.mediaEditing.videoImages) {
			untrack(() => handleVideoAsImages());
		}
	});

	let currentAssistant: AssistantInterface | undefined = $derived.by(() => {
		return A.assistants[A.conversation?.assistant ?? 'none'];
	});
</script>

{#if A.mediaEditing}
	<div class="divider !m-0 w-full">Upload options</div>
	<div class="mb-auto grid w-full grid-cols-[min-content,max-conent] items-center justify-center gap-1">
		{#if processingImages}
			<div class="loading loading-sm"></div>
		{/if}
		<div class="col-start-2 flex items-center gap-2">
			<input
				type="checkbox"
				id="as-images"
				disabled={processingImages || isPublicPage()}
				bind:checked={A.mediaEditing.videoAsImages}
				onchange={async () => {
					assert(A.mediaEditing);
					if (A.mediaEditing.videoAsImages) await handleVideoAsImages();
				}} />
			<label for="as-images">As images</label>
			<!-- <select
				class="select select-bordered select-sm"
				bind:this={DPISelector}
				onchange={handleVideoAsImages}
				disabled={processingImages || !A.mediaEditing.PDFAsImages}>
				<option value="72">72 DPI</option>
				<option value="150">150 DPI</option>
				<option value="300">300 DPI</option>
			</select> -->
		</div>
		<div class="col-start-2 mt-2 flex items-center gap-2">
			<input
				type="checkbox"
				id="send-as-pdf"
				bind:checked={A.mediaEditing.videoAsFile}
				disabled={!currentAssistant?.video || isPublicPage()}
				onchange={async () => {
					assert(A.mediaEditing);
					Object.assign(A.mediaEditing, await APIupsertMedia(A.mediaEditing));
				}} />
			<label class="relative" for="send-as-pdf"
				>Send as Video
				{#if !currentAssistant?.video}
					<InfoPopup title="Send the original file as attachment" class="-top-2 right-2 z-20">
						<p>Only Google Gemini models support direct Video upload.</p>
						<p>Check your assistant and model settings to enable it if the provider supports video</p>
					</InfoPopup>
				{/if}
			</label>
		</div>
	</div>

	<div class="flex w-full flex-col items-start gap-1 px-4">
		<div class="divider my-0 w-full">Metadata</div>
		<p class="text-sm">Duration: {A.mediaEditing.originalDuration}</p>
		<p class="text-sm">Width: {A.mediaEditing.originalWidth}</p>
		<p class="text-sm">Height: {A.mediaEditing.originalHeight}</p>
	</div>

	{#if A.mediaEditing.videoAsImages && A.mediaEditing.videoImages}
		<div class="flex w-full flex-col items-start overflow-auto px-4">
			<div class="divider my-0 w-full">Pages as images</div>
			{#each A.mediaEditing.videoImages as frame, i}
				<div class="flex gap-2">
					{#await frame}
						<div class="loading loading-sm"></div>
					{:then f}
						<input
							type="checkbox"
							id={`frame-${i}`}
							checked={!A.mediaEditing.imagesSkip?.includes(i)}
							onchange={async (e: Event) => {
								assert(A.mediaEditing);
								const selected = (e.target as HTMLInputElement).checked;
								if (!A.mediaEditing.imagesSkip) {
									A.mediaEditing.imagesSkip = [];
								}
								if (selected) await removeImageFromSkip(i);
								else await addImageToSkip(i);
							}} />

						<p class="text-sm">Frame {i} @ {f.timestamp} seconds</p>
					{/await}
				</div>
			{/each}
		</div>
	{/if}
{/if}
