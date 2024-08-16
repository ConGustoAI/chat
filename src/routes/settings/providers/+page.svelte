<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { Provider } from '$lib/components';
	import { APIdeleteProvider, APIfetchProviders, APIfetchModels, APIupsertProvider, APIfetchKeys } from '$lib/api';
	import { onMount } from 'svelte';
	import { defaultsUUID } from '$lib/db/schema/users.js';
	import { toIdMap } from '$lib/utils';
	import { toLogin } from '$lib/stores/loginModal';

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

		loading = false;
	});

	let addingProvider = false;
	async function addProvider() {
		debug('add provider');
		if (!dbUser) {
			toLogin();
			return;
		}

		addingProvider = true;

		const newProvider = await APIupsertProvider({
			userID: dbUser.id,
			name: 'New provider',
			type: 'openai',
			baseURL: 'https://api.openai.com/v1'
		});
		debug('new provider', newProvider);

		providers[newProvider.id!] = newProvider;
		addingProvider = false;
	}

	async function deleteProvider(provider: ProviderInterface) {
		debug('delete provider', provider);
		if (!dbUser) {
			toLogin();
			return;
		}

		const del = await APIdeleteProvider(provider);
		debug('delete provider', del);
		delete providers[del.id!];
		providers = providers;
	}
</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		<h2 class="card-title">API providers</h2>
		{#if loading}
			<div class="loading" />
		{/if}
	</div>

	<div class="grid min-w-max max-w-screen-xl grid-cols-[10rem,8rem,auto,6rem,6rem,4rem,0] gap-4 gap-y-2">
		<div class="divider col-span-full w-full">Your providers</div>

		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">Base URL</div>
		<div />
		<div />
		<div />
		<div />

		{#each Object.entries(providers) as [id, provider]}
			<Provider
				{dbUser}
				bind:provider
				bind:models
				bind:apiKeys
				onDeleteProvider={async () => await deleteProvider(provider)}
				edit={true}
				editDefaults={false} />
		{/each}
		<button
			class="btn btn-outline w-fit"
			disabled={addingProvider || loading}
			on:click={async () => {
				await addProvider();
			}}>
			{#if addingProvider}
				<div class="loading" />
			{:else}
				<Plus />
			{/if}
			Provider
		</button>
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
				bind:models
				bind:apiKeys
				{defaultModels}
				{defaultApiKeys}
				onDeleteProvider={() => {}}
				edit={false}
				editDefaults={false} />
		{/each}
	</div>
</div>
