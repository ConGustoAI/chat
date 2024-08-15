<script lang="ts">
	import { APIfetchKeys, APIfetchModels, APIfetchProviders } from '$lib/api';
	import { Provider } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema/users.js';
	import { toIdMap } from '$lib/utils';
	import dbg from 'debug';
	import { onMount } from 'svelte';

	const debug = dbg('app:ui:settings:admin:providers');

	export let data;
	let dbUser = data.dbUser;

	let defaultProviders: { [key: string]: ProviderInterface } = {};
	let defaultModels: { [key: string]: ModelInterface } = {};
	let defaultApiKeys: { [key: string]: ApiKeyInterface } = {};

	let loading = false;
	onMount(async () => {
		loading = true;
		const [fetchedProviders, ferchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		defaultProviders = toIdMap(fetchedProviders.filter((p) => p.userID == defaultsUUID));
		defaultModels = toIdMap(ferchedModels.filter((m) => m.userID == defaultsUUID));
		defaultApiKeys = toIdMap(fetchedApiKeys.filter((k) => k.userID == defaultsUUID));
		loading = false;
	});

	let addingProvider = false;
	// async function addProvider() {
	// 	debug('add provider');
	// 	addingProvider = true;
	// 	const newProvider = await APIupsertProvider({
	// 		userID: dbUser.id,
	// 		name: 'New provider',
	// 		type: 'openai',
	// 		baseURL: 'https://api.openai.com/v1'
	// 	});
	// 	debug('new provider', newProvider);

	// 	defaultProviders[newProvider.id!] = newProvider;
	// 	addingProvider = false;
	// }

	// async function deleteProvider(provider: ProviderInterface) {
	// 	debug('delete provider', provider);
	// 	const del = await APIdeleteProvider(provider);
	// 	debug('delete provider', del);
	// 	delete defaultProviders[del.id!];
	// 	defaultProviders = defaultProviders;
	// }
</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		<h2 class="card-title">Default API providers</h2>
		{#if loading}
			<div class="loading" />
		{/if}
	</div>

	<div class="grid min-w-max max-w-screen-xl grid-cols-[10rem,8rem,auto,6rem,6rem,4rem,0] gap-4 gap-y-2">
		<div class="divider col-span-full w-full">Default providers</div>
		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">Base URL</div>
		<div />
		<div />
		<div />
		<div />

		{#each Object.entries(defaultProviders) as [id, provider]}
			<Provider
				{dbUser}
				bind:provider
				bind:models={defaultModels}
				bind:apiKeys={defaultApiKeys}
				{defaultModels}
				{defaultApiKeys}
				onDeleteProvider={() => {}}
				edit={true}
				editDefaults={true} />
		{/each}
	</div>
</div>

<!-- <pre>{JSON.stringify(providers, null, 2)}</pre> -->
