<script lang="ts">
	import { APIdeleteProvider, APIupsertModel, APIupsertProvider } from '$lib/api';
	import { Provider } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import dbg from 'debug';
	import { Copy, Plus } from 'lucide-svelte';
	const debug = dbg('app:ui:components:ProviderGrid');

	export let providers: { [key: string]: ProviderInterface };
	export let models: { [key: string]: ModelInterface } = {};
	export let apiKeys: { [key: string]: ApiKeyInterface } = {};

	// A default provider should list both default and user models/api keys.
	// A user's custom provider should only list their own models/api keys.
	export let defaultProviders: { [key: string]: ProviderInterface } = {};
	export let defaultModels: { [key: string]: ModelInterface } = {};
	export let defaultApiKeys: { [key: string]: ApiKeyInterface } = {};

	export let dbUser: UserInterface | undefined;
	export let edit = false;

	export let showDefault: boolean = false;

	// If we are editing a default provider, we should only show the default models/api keys, and make them editable.
	export let editingDefault = false;

	let addingProvider = false;
	async function addProvider() {
		debug('add provider');
		if (!dbUser) {
			toLogin();
			return;
		}

		addingProvider = true;

		const newProvider = await APIupsertProvider({
			userID: editingDefault ? defaultsUUID : dbUser.id,
			name: 'New provider',
			type: 'openai',
			baseURL: 'https://api.openai.com/v1'
		});
		debug('new provider', newProvider);

		if (showDefault) {
			defaultProviders[newProvider.id!] = newProvider;
		} else {
			providers[newProvider.id!] = newProvider;
		}
		addingProvider = false;
	}

	async function copyProvider(provider: ProviderInterface) {
		debug('copy provider', provider);
		if (!dbUser) {
			toLogin();
			return;
		}

		const newProvider = await APIupsertProvider({
			...provider,
			id: undefined,
			userID: editingDefault ? defaultsUUID : dbUser.id,
			name: provider.name + ' (copy)'
		});

		let newModels: ModelInterface[] = [];

		// Copy all models associated with the provider. In case of editingDefault, models will be empty.
		Object.entries({ ...models, ...defaultModels }).forEach(([modelId, model]) => {
			if (model.providerID === provider.id) {
				newModels.push({
					...model,
					id: undefined,
					providerID: newProvider.id!,
					userID: editingDefault ? defaultsUUID : dbUser.id
				});
			}
		});

		const insertedModels = await Promise.all(newModels.map((m) => APIupsertModel(m)));
		if (editingDefault) {
			insertedModels.forEach((m) => {
				defaultModels[m.id!] = m;
			});
			defaultProviders[newProvider.id!] = newProvider;
		} else {
			insertedModels.forEach((m) => {
				models[m.id!] = m;
			});
			providers[newProvider.id!] = newProvider;
		}

		debug('copy provider done', newProvider);
	}

	async function deleteProvider(provider: ProviderInterface) {
		debug('delete provider', provider);
		if (!dbUser) {
			toLogin();
			return;
		}

		const del = await APIdeleteProvider(provider);
		debug('delete provider', del);
		if (showDefault) {
			delete defaultProviders[del.id!];
			defaultProviders = defaultProviders;
		} else {
			delete providers[del.id!];
			providers = providers;
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	<div class="grid w-full grid-cols-[min-content,10rem,8rem,auto,6rem,6rem,4rem,0] gap-4 gap-y-2">
		<div />
		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">Base URL</div>
		<div />
		<div />
		<div />
		<div />

		{#each Object.entries(showDefault ? defaultProviders : providers) as [id, provider]}
			<button
				class="btn btn-outline w-fit"
				title="Clone Provider"
				on:click={async () => {
					await copyProvider(provider);
				}}>
				<Copy />
			</button>

			<Provider
				{dbUser}
				bind:provider
				bind:models
				bind:apiKeys
				bind:defaultModels
				bind:defaultApiKeys
				deleteProvider={async () => await deleteProvider(provider)}
				{editingDefault}
				{edit} />
		{/each}
		{#if edit}
			<button
				class="btn btn-outline col-start-2 w-fit"
				disabled={addingProvider || !edit}
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
		{/if}
	</div>
</div>
