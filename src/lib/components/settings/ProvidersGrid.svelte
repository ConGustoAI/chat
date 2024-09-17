<script lang="ts">
	import { APIupsertProvider } from '$lib/api';
	import { InfoPopup, Provider } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { dbUser, providers } from '$lib/stores/appstate';
	import { Plus } from 'lucide-svelte';

	import dbg from 'debug';
	import { goto } from '$app/navigation';
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
	export let newProviderUserID: string;
	// Same for the children (models/api keys) of the provider.
	export let newChildUserID: string;

	let addingProvider = false;
	async function addProvider() {
		debug('add provider');
		if (!$dbUser || !newProviderUserID) {
			await goto('/login', { invalidateAll: true });
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
	<div
		class="grid w-full grid-cols-[min-content,10rem,8rem,8rem,auto,6rem,6rem,min-content,min-content,0] items-center gap-4 gap-y-2">
		<div />
		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">
			Stream usage<InfoPopup title="Request usage information at the end of text stream">
				<p>OpenAI has introduced a feature that allows requesting token usage statistics at the conclusion of a text stream.</p>
				<p>Some other providers are using an older version of the API that lacks this functionality.</p>
				<p>Enable this option if your OpenAI-compatible provider supports</p>
				<pre><code>stream_options: &lbrace; include_usage: true &rbrace;</code></pre>
				<p>Note: Anthropic and Google APIs always provide usage information, so this setting doesn't apply to them.</p>
			</InfoPopup>
		</div>
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
