<script lang="ts">
	import { APIupsertMedia } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { PDFToImages } from '$lib/utils/pdf.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';
	import dbg from 'debug';
	import { untrack } from 'svelte';
	import InfoPopup from '../InfoPopup.svelte';
	import { addImageToSkip, removeImageFromSkip } from '$lib/utils/media_utils.svelte';
	const debug = dbg('app:ui:components:MediaPDFControls');

	let DPISelector: HTMLSelectElement | null = $state(null);
	let processingImages = $state(false);

	async function handlePdfAsImages() {
		assert(DPISelector);
		assert(A.mediaEditing);
		assert(A.mediaEditing.original);
		debug('handlePdfAsImages', DPISelector.value);
		processingImages = true;

		try {
			A.mediaEditing.PDFAsImagesDPI = parseInt(DPISelector.value);
			const newImages = await PDFToImages(A.mediaEditing);

			// Here we await the promises, so they are fully resolved when the page is rendered.
			// This avoids flicker, as otherwise there would be a short period of no images displayed
			/// while the promises resolve.
			await Promise.all(newImages);
			A.mediaEditing.PDFImages = newImages;
			Object.assign(A.mediaEditing, await APIupsertMedia(A.mediaEditing));
		} finally {
			processingImages = false;
		}
	}

	$effect(() => {
		if (A.mediaEditing?.PDFAsImages && DPISelector) {
			DPISelector.value = A.mediaEditing?.PDFAsImagesDPI?.toString() ?? '300';
		}
		if (
			A.mediaEditing?.PDFAsImages &&
			DPISelector?.value &&
			DPISelector?.value !== A.mediaEditing?.PDFAsImagesDPI?.toString()
		) {
			untrack(() => handlePdfAsImages());
		}
	});

	let currentAssistant: AssistantInterface | undefined = $derived.by(() => {
		return A.assistants[A.conversation?.assistant ?? 'none'];
	});
</script>

{#if A.mediaEditing}
	<div class="divider !m-0 w-full">Upload options</div>
	<div class="mb-auto grid w-full grid-cols-[min-content,max-conent] items-center justify-end gap-1">
		{#if processingImages}
			<div class="loading loading-sm"></div>
		{/if}
		<div class="col-start-2 flex items-center gap-2">
			<input
				type="checkbox"
				id="as-images"
				disabled={processingImages ||
					(currentAssistant && !currentAssistant.images && !A.mediaEditing.PDFAsImages) ||
					isPublicPage()}
				bind:checked={A.mediaEditing.PDFAsImages}
				onchange={async () => {
					assert(A.mediaEditing);
					await handlePdfAsImages();
				}} />
			<label for="as-images">As images</label>
			<select
				class="select select-bordered select-sm"
				bind:this={DPISelector}
				onchange={handlePdfAsImages}
				disabled={processingImages || !A.mediaEditing.PDFAsImages}>
				<option value="72">72 DPI</option>
				<option value="150">150 DPI</option>
				<option value="300">300 DPI</option>
			</select>
		</div>

		{#if A.mediaEditing.PDFAsImages && currentAssistant && !currentAssistant.images}
			<div class="col-start-2 w-full text-error">
				<p>Assistant does not support images</p>
			</div>
		{/if}

		<div class="col-start-2 mt-2 flex items-center gap-2">
			<input
				disabled
				type="checkbox"
				id="extract-text-images"
				bind:checked={A.mediaEditing.PDFAsDocument}
				onchange={async () => {
					assert(A.mediaEditing);
					Object.assign(A.mediaEditing, await APIupsertMedia(A.mediaEditing));
				}} />
			<label for="extract-text-images">Extract text and images</label>
		</div>

		<div class="col-start-2 mt-2 flex items-center gap-2">
			<input
				type="checkbox"
				id="send-as-pdf"
				bind:checked={A.mediaEditing.PDFAsFile}
				disabled={(currentAssistant && !A.mediaEditing.PDFAsFile && !currentAssistant?.pdf) || isPublicPage()}
				onchange={async () => {
					assert(A.mediaEditing);
					Object.assign(A.mediaEditing, await APIupsertMedia(A.mediaEditing));
				}} />
			<label class="relative" for="send-as-pdf">Send as PDF </label>
			<InfoPopup title="Send the original file as attachment" class="-top-2 right-2 z-20">
				<p>Only Google Gemini models support direct PDF upload.</p>
			</InfoPopup>
		</div>

		{#if A.mediaEditing.PDFAsFile && currentAssistant && !currentAssistant.pdf}
			<div class="col-start-2 w-full text-error">
				<p>Assistant does not support PDF</p>
			</div>
		{/if}
	</div>
	{#if A.mediaEditing.PDFMeta}
		<div class="flex w-full flex-col items-start gap-1 px-4">
			<div class="divider my-0 w-full">Metadata</div>
			{#await A.mediaEditing.PDFMeta}
				<div class="loading loading-sm"></div>
			{:then meta}
				<p class="text-sm">Pages: {meta.numPages}</p>
				<p class="text-sm">Title: {meta.title}</p>
				<p class="text-sm">Author: {meta.author}</p>
				<p class="text-sm">Subject: {meta.subject}</p>
			{/await}
		</div>
	{/if}

	{#if A.mediaEditing.PDFAsImages && A.mediaEditing.PDFImages}
		<div class="flex w-full flex-col items-start overflow-auto px-4">
			<div class="divider my-0 w-full">Pages as images</div>
			{#each A.mediaEditing.PDFImages as pdfImage, i}
				<div class="flex gap-2">
					<input
						type="checkbox"
						id={`page-${i}`}
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

					{#await pdfImage}
						<div class="loading loading-sm"></div>
					{:then p}
						<p class="text-sm">Page {i + 1}: {p.width}x{p.height}</p>
					{/await}
				</div>
			{/each}
		</div>
	{/if}
{/if}
