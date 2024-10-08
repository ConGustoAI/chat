<script lang="ts">
	import '../app.css';

	import { A } from '$lib/appstate.svelte';
	import { ModeWatcher, mode } from 'mode-watcher';

	$effect(() => {
		if ($mode === 'light') {
			import('highlight.js/styles/github.min.css');
		} else {
			import('highlight.js/styles/github-dark.min.css');
		}
	});

	import dbg from 'debug';
	const debug = dbg('app:ui:settings:layout');

	let { data, children } = $props();

	$effect(() => {
		A.dbUser = data.dbUser;
	});

	$effect(() => {
		A.hiddenItems = data.hiddenItems;
	});
</script>

<ModeWatcher />

{@render children()}

<!-- <pre>{JSON.stringify($dbUser , null, 2)}</pre> -->
