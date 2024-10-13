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
	import { APIfetchAssistants, APIfetchHidden, APIfetchKeys, APIfetchModels, APIfetchProviders } from '$lib/api';
	import { toIdMap } from '$lib/utils/utils';
	import { untrack } from 'svelte';
	const debug = dbg('app:ui:settings:layout');

	let { data, children } = $props();

	// $effect(() => {
	// 	A.dbUser = data.dbUser;
	// });

	$effect(() => {
		untrack(() => {
			debug("root layout effect: %o", {data_dbUser: data.dbUser, A_dbUser: A.dbUser})

			if (data.dbUser) {
				if (data.dbUser.id !== A.dbUser?.id) {
					debug('dbUser changed, fetching data', $state.snapshot(A.dbUser));

					Promise.all([APIfetchAssistants(), APIfetchProviders(), APIfetchModels(), APIfetchKeys(), APIfetchHidden()]).then(
						([fetchedAssistants, fetchedProviders, fetchedModels, fetchedApiKeys, fetchedHidden]) => {
							A.assistants = toIdMap(fetchedAssistants);
							A.providers = toIdMap(fetchedProviders);
							A.models = toIdMap(fetchedModels);
							A.apiKeys = toIdMap(fetchedApiKeys);
							A.hiddenItems = fetchedHidden;

							debug(
								'Done fetching',
								$state.snapshot({
									assistants: A.assistants,
									providers: A.providers,
									models: A.models,
									dbUser: A.dbUser,
									apiKeys: Object.keys(A.apiKeys)
								})
							);
						}
					);
				}
			} else {
				A.assistants = {};
				A.providers = {};
				A.models = {};
				A.apiKeys = {};
			}
		});
		A.dbUser = data.dbUser;
	});

	$effect(() => {
		A.hiddenItems = data.hiddenItems;
	});
</script>

<ModeWatcher />

{@render children()}

<!-- <pre>{JSON.stringify($dbUser , null, 2)}</pre> -->
