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
	import {
		APIfetchAssistants,
		APIfetchHidden,
		APIfetchKeys,
		APIfetchModels,
		APIfetchProviders,
		APIfetchUser
	} from '$lib/api';
	import { toIdMap } from '$lib/utils/utils';
	import { untrack } from 'svelte';
	const debug = dbg('app:layout');

	let { data, children } = $props();

	$effect(() => {
		untrack(() => {
			debug('root layout effect: %o', { session: data.session, A_user: A.user });

			if (!data.session || data.session.userID !== A.user?.id) {
				debug('user changed, fetching data', $state.snapshot(A.user));

				Promise.all([
					APIfetchAssistants(),
					APIfetchProviders(),
					APIfetchModels(),
					APIfetchKeys(),
					APIfetchHidden()
				]).then(([fetchedAssistants, fetchedProviders, fetchedModels, fetchedApiKeys, fetchedHidden]) => {
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
							user: A.user,
							apiKeys: Object.keys(A.apiKeys)
						})
					);
				});
			}
		});
		A.user = data.session?.user;
	});
</script>

<ModeWatcher />

{@render children()}
