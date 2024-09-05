<script lang="ts">
	import '../app.css';

	import { apiKeys, assistants, dbUser, hiddenItems, models, providers } from '$lib/stores/appstate';
	import { toIdMap } from '$lib/utils';
	import { ModeWatcher, mode } from 'mode-watcher';

	$: {
		if ($mode === 'light') {
			import('highlight.js/styles/github.min.css');
		} else {
			import('highlight.js/styles/github-dark.min.css');
		}
	}

	import { APIfetchKeys, APIfetchModels, APIfetchProviders } from '$lib/api';
	import dbg from 'debug';
	const debug = dbg('app:ui:settings:layout');

	export let data;

	let loading = false;

	$: $dbUser = data.dbUser;
	$: $hiddenItems = data.hiddenItems;

	dbUser.subscribe(async () => {
		debug('dbUser changed, fetching data');
		loading = true;
		const [fetchedProviders, fetchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		$assistants = toIdMap(data.assistants);
		$providers = toIdMap(fetchedProviders);
		$models = toIdMap(fetchedModels);
		$apiKeys = toIdMap(fetchedApiKeys);
		loading = false;

		debug('Done fetching', {
			assistants: $assistants,
			providers: $providers,
			models: $models,
			dbUser: $dbUser,
			apiKeys: Object.keys($apiKeys)
		});
	});
</script>

<ModeWatcher />

<slot />

<!-- <pre>{JSON.stringify($dbUser , null, 2)}</pre> -->
