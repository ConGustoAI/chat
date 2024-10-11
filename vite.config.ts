/* eslint-disable @typescript-eslint/no-explicit-any */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { Plugin, ViteDevServer } from 'vite';


// Delay restart on server-side files.
function debounceRestart(): Plugin {
	let timeout: NodeJS.Timeout;

	function debounce(func: { (server: ViteDevServer): void; apply?: any }, delay: number) {
		return function (this: any, ...args: any) {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				func.apply(this, args);
			}, delay);
		};
	}

	const debouncedRestart = debounce((server: ViteDevServer) => {
		server.restart();
	}, 5000);

	return {
		name: 'debounce-restart',
		handleHotUpdate({ file, server }: { file: string; server: ViteDevServer }) {
			if (file.endsWith('.js') || file.endsWith('.ts')) {
				debouncedRestart(server);
				return [];
			}
		}
	};
}

export default defineConfig({
	plugins: [debounceRestart(), sveltekit()]
});
