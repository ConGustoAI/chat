<script lang="ts">
	import '../app.css';

	import { dbUser, hiddenItems } from '$lib/stores/appstate';
	import { ModeWatcher, mode } from 'mode-watcher';

	$: {
		if ($mode === 'light') {
			import('highlight.js/styles/github.min.css');
		} else {
			import('highlight.js/styles/github-dark.min.css');
		}
	}

	import dbg from 'debug';
	const debug = dbg('app:ui:settings:layout');

	export let data;

	$: $dbUser = data.dbUser;
	$: $hiddenItems = data.hiddenItems;
</script>

<ModeWatcher />

<slot />

<!-- <pre>{JSON.stringify($dbUser , null, 2)}</pre> -->
