<script lang="ts">
	let { media = $bindable() }: { media: MediaInterface } = $props();
</script>

{#if media.PDFImages}
	{#each media.PDFImages as pdfImage, i}
		{#await pdfImage }
			<div class="w-full h-full bg-blue-500"></div>
			<p>Loading page {i+1}...</p>
		{:then p}
			<p class="px-2">Page {i+1}</p>
			<img src={p.url} alt={`page ${i}`} class="pixilated w-full border-gray-300 object-contain p-2" />
		{:catch error}
			<p>Error loading page {i}: {error.message}</p>
		{/await}
	{/each}
{/if}
