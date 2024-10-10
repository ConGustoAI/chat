import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		watch: {
			usePolling: true,
			interval: 5000 // Delay in milliseconds
		}
	},
	plugins: [sveltekit()]
});
