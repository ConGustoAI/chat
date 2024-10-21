import { A } from '$lib/appstate.svelte';
import { assert } from './utils';

import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export async function pdfThumbnail(file: FileInterface): Promise<FileInterface | undefined> {
	assert(file.file);
	const pdfData = await file.file.arrayBuffer();

	// await pdfInit();

	const pdfDocument = await pdfjs.getDocument({ data: pdfData }).promise;

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
