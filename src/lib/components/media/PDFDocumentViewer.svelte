<!-- <script lang="ts">
	import { untrack } from 'svelte';

	import { pdfjs } from '$lib/utils/pdf.svelte';
	import dbg from 'debug';
	import type { TextItem } from 'pdfjs-dist/types/src/display/api';
	const debug = dbg('app:ui:components:PDFDocumentViewer');

	let { media }: { media: MediaInterface } = $props();

	let document: pdfjs.PDFDocumentProxy | undefined = $state();

	async function getDocument(url: string) {
		const pdf = await pdfjs.getDocument(url).promise;
		document = pdf;
	}

	$effect(() => {
		if (media.original?.url) untrack(() => getDocument(media.original!.url!));
	});

	async function renderPage(pageNumber: number) {
		if (document) {
			const page = await document.getPage(pageNumber);
			const content = await page.getTextContent({});
			debug('content:', pageNumber, content);

			const text = content.items
				.filter((item): item is TextItem => 'str' in item)
				.map((item) => item.str ?? '')
				.join('');
			debug('text:', pageNumber, text);
		}
	}

	$effect(() => {
		if (document) {
			for (let i = 1; i <= document.numPages; i++) {
				renderPage(i);
			}
		}
	});
</script> -->
