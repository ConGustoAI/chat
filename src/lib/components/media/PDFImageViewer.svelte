<script lang="ts">
	let { media = $bindable() }: { media: MediaInterface } = $props();
</script>

{#if media.pdfImages}
	{#each media.pdfImages as pdfImage, i}
		<img src={pdfImage.url} alt={`page ${i}`} class="pixilated w-full border-gray-300 object-contain p-2" />
	{/each}
{/if}
