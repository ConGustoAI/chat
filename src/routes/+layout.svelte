<script>
	import '../app.css';

	import { Login } from '$lib/components';
	import { loginModal } from '$lib/stores/loginModal';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { toIdMap, censorKey } from '$lib/utils';
	import { dbUser, assistants, hiddenItems, providers, models, apiKeys } from '$lib/stores/appstate';
	import { onMount } from 'svelte';

	$: {
		if ($mode === 'light') {
			import('highlight.js/styles/github.min.css');
		} else {
			import('highlight.js/styles/github-dark.min.css');
		}
	}

	import dbg from 'debug';
	import { APIfetchKeys, APIfetchModels, APIfetchProviders } from '$lib/api';
	const debug = dbg('app:ui:settings:layout');

	export let data;
	export let form;

	let loading = false;
	onMount(async () => {
		debug('onMount');
		loading = true;

		$dbUser = data.dbUser;
		$hiddenItems = data.hiddenItems;

		const [fetchedProviders, fetchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		$assistants = toIdMap(data.assistants);

		providers.set(toIdMap(fetchedProviders));
		models.set(toIdMap(fetchedModels));
		apiKeys.set(toIdMap(fetchedApiKeys));
		loading = false;

		debug('onMount', {
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

<dialog bind:this={$loginModal} id="loginModal" class="modal modal-middle">
	<div class="modal-box h-fit w-fit">
		<Login {form} />
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
