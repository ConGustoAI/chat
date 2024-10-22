<script lang="ts">
	import { APIupsertMedia } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { PDFToImages } from '$lib/utils/pdf';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { untrack } from 'svelte';
	import InfoPopup from '../InfoPopup.svelte';
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
			const DPI = parseInt(DPISelector.value);
			await PDFToImages(A.mediaEditing, DPI);
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
				disabled={processingImages}
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
				disabled={processingImages}>
				<option value="72">72 DPI</option>
				<option value="150">150 DPI</option>
				<option value="300">300 DPI</option>
			</select>
		</div>
		<div class="col-start-2 mt-2 flex items-center gap-2">
			<input
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
				onchange={async () => {
					assert(A.mediaEditing);
					Object.assign(A.mediaEditing, await APIupsertMedia(A.mediaEditing));
				}} />
			<label for="send-as-pdf">Send as PDF</label>
			<InfoPopup title="Send the original file" class="z-20">
				<p>Send the PDF file as an attachment.</p>
			</InfoPopup>
		</div>
	</div>
	{#if A.mediaEditing.PDFAsImages && A.mediaEditing.pdfImages}
		<div class="flex flex-col items-end overflow-auto">
			{#each A.mediaEditing.pdfImages as pdfImage, i}
				<p class="text-sm">Page {i}: {pdfImage.width}x{pdfImage.height}</p>
			{/each}
		</div>
	{/if}
{/if}
