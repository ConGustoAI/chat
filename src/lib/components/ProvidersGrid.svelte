<script lang="ts">
	import { APIupsertProvider } from '$lib/api';
	import { Provider } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { dbUser, providers } from '$lib/stores/appstate';
	import { toLogin } from '$lib/stores/loginModal';
	import { Plus } from 'lucide-svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:ProviderGrid');

	export let edit = false;
	export let allowHiding = true;

	export let showDefault: boolean;
	export let showCustom: boolean;
	export let showDefaultChildren: boolean;
	export let showCustomChildren: boolean;
	export let editDefaultChildren: boolean;
	export let editCustomChildren: boolean;

	// When adding a new provider, it can be assigned to a user or be a default provider.
	export let newProviderUserID: string | undefined;
	// Same for the children (models/api keys) of the provider.
	export let newChildUserID: string | undefined;

	let addingProvider = false;
	async function addProvider() {
		debug('add provider');
		if (!$dbUser || !newProviderUserID) {
			toLogin();
			return;
		}

		addingProvider = true;

		const newProvider = await APIupsertProvider({
			userID: newProviderUserID,
			name: 'New provider',
			type: 'openai',
			baseURL: 'https://api.openai.com/v1'
		});
		debug('new provider', newProvider);

		providers.update((current) => {
			current[newProvider.id!] = newProvider;
			return current;
		});

		addingProvider = false;
	}
</script>

<div class="flex w-full flex-col gap-4">
	<div class="grid w-full grid-cols-[min-content,10rem,8rem,auto,6rem,6rem,min-content,min-content,0] gap-4 gap-y-2">
		<div />
		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">Base URL</div>
		<div />
		<div />
		<div class="font-bold">Hide</div>
		<div class="font-bold">Delete</div>
		<div />

		{#each Object.entries($providers) as [i, provider]}
			{#if (showDefault && provider.userID === defaultsUUID) || (showCustom && provider.userID !== defaultsUUID)}
				<Provider
					bind:provider
					{edit}
					{allowHiding}
					{showDefaultChildren}
					{showCustomChildren}
					{editDefaultChildren}
					{editCustomChildren}
					{newProviderUserID}
					{newChildUserID} />
			{/if}
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
