import { A } from '$lib/appstate.svelte';
import { assert } from './utils';
import dbg from 'debug';
const debug = dbg('app:utils:pdf');

import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export { pdfjs };

export async function PDFThumbnail(media: MediaInterface): Promise<FileInterface> {
	// await pdfInit();
	debug('pdfThumbnail', $state.snapshot(media));
	assert(media.type === 'pdf');
	assert(media.PDFDocument);

	A.mediaProcessing = (A.mediaProcessing ?? 0) + 1;
	media.processing = (media.processing ?? 0) + 1;

	try {
		const pdfDocument = await media.PDFDocument;
		assert(pdfDocument.numPages > 0);

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
	} finally {
		A.mediaProcessing--;
		media.processing--;
	}
}

// Note: This returns ann array of promises that resolve to the URLs of the images.
export async function PDFToImages(media: MediaInterface): Promise<Promise<PDFImageInterface>[]> {
	assert(media.type === 'pdf');
	assert(media.PDFDocument);
	assert(media.original?.url);
	assert(media.PDFAsImagesDPI);

	A.mediaProcessing = (A.mediaProcessing ?? 0) + 1;
	media.processing = (media.processing ?? 0) + 1;

	const PDFImageURLs: Promise<PDFImageInterface>[] = [];

	const pdfDocument = await media.PDFDocument;
	try {
		for (let page = 1; page <= pdfDocument.numPages; page++) {
			const pdfPage = await pdfDocument.getPage(page);
			const viewport = pdfPage.getViewport({ scale: media.PDFAsImagesDPI / 72 }); // 72 DPI is the default.

			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			assert(context);

			canvas.width = viewport.width;
			canvas.height = viewport.height;

			await pdfPage.render({ canvasContext: context, viewport }).promise;
			const url = new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')).then((blob) => {
				assert(blob);
				return {
					url: URL.createObjectURL(blob),
					blob,
					width: canvas.width,
					height: canvas.height
				};
			});
			PDFImageURLs.push(url);
		}

		return PDFImageURLs;
	} finally {
		A.mediaProcessing--;
		media.processing--;
	}
}

export async function PDFGetMeta(media: MediaInterface): Promise<PDFMeta> {
	assert(media.type === 'pdf');
	assert(media.PDFDocument);
	const pdfDocument = await media.PDFDocument;
	const meta = (await pdfDocument.getMetadata()) as {
		Author?: string;
		Subject?: string;
		Title?: string;
	};

	return {
		numPages: pdfDocument.numPages,
		author: meta?.Author,
		subject: meta?.Subject,
		title: meta?.Title
	};
}

export async function PDFGetDocument(media: MediaInterface): Promise<pdfjs.PDFDocumentProxy> {
	assert(media.type === 'pdf');
	assert(media.original?.file);
	return pdfjs.getDocument({ data: await media.original.file.arrayBuffer() }).promise;
}
