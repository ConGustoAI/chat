<script lang="ts">
	import { APIdeleteProvider, APIfetchKeys, APIfetchModels, APIfetchProviders, APIupsertProvider } from '$lib/api';
	import { ProvidersGrid } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema/users.js';
	import { toLogin } from '$lib/stores/loginModal';
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

<div class="flex max-w-screen-xl flex-col gap-4">
	<div class="div flex gap-4">
		<div class="flex w-fit items-center gap-4 text-nowrap font-bold">
			<span class="text-xl">Default API providers.</span>
			<span class="alert alert-warning py-0">Changes made here will be visible to and will affect all users</span>
		</div>
		{#if loading}
			<div class="loading" />
		{/if}
	</div>

	<div class="divider mt-10 w-full"></div>

	<div class="div flex grow">
		<ProvidersGrid
			{dbUser}
			providers={{}}
			models={{}}
			bind:defaultProviders
			bind:defaultModels
			bind:defaultApiKeys
			edit={true}
			showDefault={true}
			editingDefault={true} />
	</div>
</div>
