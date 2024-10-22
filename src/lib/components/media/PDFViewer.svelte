<script lang="ts">
	import { assert } from '$lib/utils/utils';
	import * as pdfjs from 'pdfjs-dist';
	import { onMount, untrack } from 'svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:PDFViewer');

	pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

	// The PDF will be scaled up to this width, and the canvas will be resized to match the height.
	const canvasWidth = 1000;

	let { media }: { media: MediaInterface } = $props();

	let canvases: HTMLCanvasElement[] = $state([]);
	let document: pdfjs.PDFDocumentProxy | undefined = $state();

	async function getDocument(url: string) {
		const pdf = await pdfjs.getDocument(url).promise;
		document = pdf;
		canvases = Array(pdf.numPages).fill(null);
	}

	$effect(() => {
		if (media.original?.url) untrack(() => getDocument(media.original!.url!));
	});

	async function renderPage(pageNumber: number) {
		if (document && canvases[pageNumber - 1]) {
			const page = await document.getPage(pageNumber);
			const canvas = canvases[pageNumber - 1];
			const context = canvas.getContext('2d');
			assert(context);
			const viewport = page.getViewport({ scale: 4.17 }); // 300 DPI
			canvas.height = viewport.height;
            canvas.width = viewport.width;

			debug('renderPage:', { pageNumber, viewport, canvas });
			page.render({ canvasContext: context, viewport, intent: 'any' });
		}
	}

	$effect(() => {
		if (document) {
			for (let i = 1; i <= document.numPages; i++) {
				if (canvases[i-1]) renderPage(i);
			}
		}
	});
</script>

<!-- <div class="flex h-full w-full shrink grow-0 flex-col gap-2 overflow-auto"> -->
	{#each canvases as __, i}
		<canvas bind:this={canvases[i]} width={canvasWidth} class="w-full border-gray-300 object-contain p-2"> </canvas>
	{/each}
<!-- </div> -->
