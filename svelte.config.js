// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
// import adapter from "svelte-adapter-bun";
// import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { copyFileSync } from 'fs';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter()
	},
	vitePlugin: {
		dynamicCompileOptions({ filename }) {
			if (filename.includes('node_modules')) {
				return { runes: undefined }; // or false, check what works
			}
		}
	},
	compilerOptions: {
		runes: true
	},
	hooks: {
		async buildStart() {
		  const workerSrc = path.resolve('node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
		  const workerDest = path.resolve('static', 'pdf.worker.mjs');
		  copyFileSync(workerSrc, workerDest);
		  console.log('PDF.js worker copied to static directory');
		}
	  }
	// vite: {
	// 	build: {
	// 		rollupOptions: {
	// 			output: {
	// 				manualChunks: {
	// 					'pdf.worker': ['pdfjs-dist/build/pdf.worker.mjs']
	// 				}
	// 			}
	// 		}
	// 	}
	// }
};

export default config;
