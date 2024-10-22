import { A } from '$lib/appstate.svelte';
import { assert } from './utils';
import dbg from 'debug';
const debug = dbg('app:utils:pdf');

import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export async function PDFThumbnail(file: FileInterface): Promise<FileInterface | undefined> {
	// await pdfInit();
	debug('pdfThumbnail', file);

	const pdfDocument = await pdfjs.getDocument({ url: file.url }).promise;

	if (pdfDocument.numPages > 0) {
		const page = await pdfDocument.getPage(1);
		const viewport = page.getViewport({ scale: 1 });

		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		assert(context);

		canvas.width = 300;
		canvas.height = 300;

		// Calculate the scale to fit the canvas
		const scale = Math.min(canvas.width / viewport.width);

		// Create a new viewport with the calculated scale
		const scaledViewport = page.getViewport({ scale });

		// Set canvas dimensions to match the scaled viewport
		canvas.width = scaledViewport.width;
		// canvas.height = scaledViewport.height;

		await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
		assert(blob);
		const file = new File([blob], 'pdf-thumbnail');

		debug('pdfThumbnail done');
		return {
			userID: A.dbUser?.id ?? 'anon',
			mimeType: 'image/png',
			size: blob?.size,
			file,
			isThumbnail: true,
			url: URL.createObjectURL(file)
		};
	}
}

export async function PDFToImages(media: MediaInterface, dpi: number): Promise<void> {
	assert(media.type === 'pdf');
	assert(media.original?.url);
	const pdfDocument = await pdfjs.getDocument({ url: media.original.url }).promise;

	const PDFImages: PDFImageInterface[] = [];

	media.processing = (media.processing ?? 0) + 1;
	try {
		for (let page = 1; page <= pdfDocument.numPages; page++) {
			const pdfPage = await pdfDocument.getPage(page);
			const viewport = pdfPage.getViewport({ scale: dpi / 72 }); // 72 DPI is the default.

			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			assert(context);

			canvas.width = viewport.width;
			canvas.height = viewport.height;

			await pdfPage.render({ canvasContext: context, viewport }).promise;
			const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
			assert(blob);
			PDFImages.push({
				url: URL.createObjectURL(blob),
				blob,
				width: canvas.width,
				height: canvas.height
			});
		}

		media.PDFAsImagesDPI = dpi;
		media.pdfImages = PDFImages;
	} finally {
		media.processing = (media.processing ?? 0) - 1;
	}
}
