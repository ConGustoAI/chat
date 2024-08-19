<script lang="ts">
	import { APIfetchKeys, APIfetchModels, APIfetchProviders } from '$lib/api';
	import { defaultsUUID } from '$lib/db/schema/users.js';
	import { toIdMap } from '$lib/utils';
	import { onMount } from 'svelte';

	import ProviderGrid from '$lib/components/ProvidersGrid.svelte';
	import dbg from 'debug';

	const debug = dbg('app:ui:settings:providers');

	export let data;
	let dbUser = data.dbUser;

	let providers: { [key: string]: ProviderInterface } = {};
	let defaultProviders: { [key: string]: ProviderInterface } = {};
	let models: { [key: string]: ModelInterface } = {};
	let defaultModels: { [key: string]: ModelInterface } = {};
	let apiKeys: { [key: string]: ApiKeyInterface } = {};
	let defaultApiKeys: { [key: string]: ApiKeyInterface } = {};

	let loading = false;

	onMount(async () => {
		loading = true;
		debug('onMount');
		const [fetchedProviders, ferchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		defaultProviders = toIdMap(fetchedProviders.filter((p) => p.userID == defaultsUUID));
		defaultModels = toIdMap(ferchedModels.filter((m) => m.userID == defaultsUUID));
		defaultApiKeys = toIdMap(fetchedApiKeys.filter((k) => k.userID == defaultsUUID));

		if (dbUser) {
			providers = toIdMap(fetchedProviders.filter((p) => p.userID == dbUser.id));
			models = toIdMap(ferchedModels.filter((m) => m.userID == dbUser.id));
			apiKeys = toIdMap(fetchedApiKeys.filter((k) => k.userID == dbUser.id));
		}

		debug('onMount', { providers, defaultProviders, models, defaultModels, apiKeys, defaultApiKeys });

		loading = false;
	});
</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		{#if loading}
			<div class="loading" />
		{/if}
		<h2 class="card-title">API providers</h2>
	</div>

	<div class=" max-w-screen-xl">
		<div class="divider w-full">Your Providers</div>
		<ProviderGrid
			{dbUser}
			bind:providers
			bind:models
			bind:apiKeys
			showDefault={false}
			edit={true}
			editingDefault={false} />

		<div class="divider mt-10 w-full">Default Providers</div>
		<ProviderGrid
			{dbUser}
			bind:providers
			bind:models
			bind:apiKeys
			bind:defaultProviders
			bind:defaultModels
			bind:defaultApiKeys
			showDefault={true}
			edit={false}
			editingDefault={false} />
	</div>
</div>
