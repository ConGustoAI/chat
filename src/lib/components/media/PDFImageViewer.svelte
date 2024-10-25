<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { addImageToSkip, removeImageFromSkip } from '$lib/utils/media_utils.svelte';
	import { assert } from '$lib/utils/utils';

	let { media = $bindable() }: { media: MediaInterface } = $props();
</script>

{#if media.PDFImages}
	{#each media.PDFImages as pdfImage, i}
		{#await pdfImage}
			<div class="h-full w-full bg-blue-500"></div>
			<p>Loading page {i + 1}...</p>
		{:then p}
			<div class="flex gap-1">
				<p class="px-2">Page {i + 1}</p>
				<input
					type="checkbox"
					id={`page-${i}`}
					checked={!A.mediaEditing?.PDFImagesSkip?.includes(i)}
					onchange={async (e: Event) => {
						assert(A.mediaEditing);
						const selected = (e.target as HTMLInputElement).checked;
						if (!A.mediaEditing.PDFImagesSkip) {
							A.mediaEditing.PDFImagesSkip = [];
						}
						if (selected) await removeImageFromSkip(i);
						else await addImageToSkip(i);
					}} />
			</div>

			<img
				src={p.url}
				alt={`page ${i}`}
				class="pixilated w-full border-gray-300 object-contain p-2"
				class:opacity-50={A.mediaEditing?.PDFImagesSkip?.includes(i)} />
		{:catch error}
			<p>Error loading page {i}: {error.message}</p>
		{/await}
	{/each}
{/if}
