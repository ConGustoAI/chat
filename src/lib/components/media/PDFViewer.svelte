<script lang="ts">
	import { assert } from '$lib/utils/utils';
	import * as pdfjs from 'pdfjs-dist';
	import { untrack } from 'svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:PDFViewer');

	pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

	// The PDF will be scaled up to this width, and the canvas will be resized to match the height.
	const canvasWidth = 1000;

	let { media }: { media: MediaInterface } = $props();

	let canvases: HTMLCanvasElement[] = $state([]);

	let n = 100;

	async function renderPage(pageNumber: number) {
		if (media.PDFDocument && canvases[pageNumber - 1] && n-- > 0) {
			const page = await (await media.PDFDocument).getPage(pageNumber);
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

	let meta: PDFMeta | undefined = $state();

	$effect(() => {
		for (let i = 0; i < canvases.length; i++) {
			renderPage(i + 1);
		}
	});

	$effect(() => {
		media.PDFMeta?.then((m) =>
			untrack(() => {
				meta = m;
				canvases = Array(meta.numPages).fill(null);
				debug('PDFMeta:', m);
			})
		);
	});
</script>

<!-- <div class="flex h-full w-full shrink grow-0 flex-col gap-2 overflow-auto"> -->
{#each canvases as __, i}
	<p class="px-2">Page {i + 1}</p>
	<canvas bind:this={canvases[i]} width={canvasWidth} class="w-full border-gray-300 object-contain p-2"> </canvas>
{/each}
<!-- </div> -->
