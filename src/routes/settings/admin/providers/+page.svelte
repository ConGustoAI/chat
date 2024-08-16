<script lang="ts">
	import { APIdeleteProvider, APIfetchKeys, APIfetchModels, APIfetchProviders, APIupsertProvider } from '$lib/api';
	import { Provider } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema/users.js';
	import { toIdMap } from '$lib/utils';
	import dbg from 'debug';
	import { Plus } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toLogin } from '$lib/stores/loginModal';

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
	async function addProvider() {
		debug('add provider');
		addingProvider = true;
		if (!dbUser) {
			toLogin();
			return;
		}

		const newProvider = await APIupsertProvider({
			userID: defaultsUUID,
			name: 'New provider',
			type: 'openai',
			baseURL: 'https://api.openai.com/v1'
		});
		debug('new provider', newProvider);

		defaultProviders[newProvider.id!] = newProvider;
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
		delete defaultProviders[del.id!];
		defaultProviders = defaultProviders;
	}
</script>

<div class="flex flex-col gap-1">
	<div class="div flex grow gap-2"></div>

	<div class="grid min-w-max max-w-screen-xl grid-cols-[10rem,8rem,auto,6rem,6rem,4rem,0] gap-4 gap-y-2">
		<h2 class="card-title text-nowrap">
			<div class="alert alert-warning w-fit">
				<span>Default API providers. Changes made here will be visible to and will affect all users</span>
			</div>
		</h2>
		{#if loading}
			<div class="loading" />
		{/if}

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
				models={{}}
				apiKeys={{}}
				{defaultModels}
				{defaultApiKeys}
				onDeleteProvider={async () => {
					await deleteProvider(provider);
				}}
				edit={true}
				editDefaults={true} />
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
</div>

<!-- <pre>{JSON.stringify(providers, null, 2)}</pre> -->
