<script lang="ts">
	import { Plus } from 'lucide-svelte';

	import { Provider } from '$lib/components';
	import { fetchProviders, fetchKey, upsertProvider, upsertKey, deleteProvider, deleteKey } from '$lib/api-client.js';

	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';

	let providers: ProviderInterface[] = [];

	onMount(async () => {
		providers = await fetchProviders(true, false);
	});

	function addProvider() {
		console.log('add provider');
		providers = [...providers, { name: 'New provider', type: 'openai', baseURL: 'https://api.openai.com/v1' }];
	}

	async function onDeleteProvider(idx: number) {
		console.log('delete provider', idx);
		if (providers[idx].id) {
			// Delete from the database
			await deleteProvider(providers[idx].id);
		}
		providers = providers.filter((_, index) => index !== idx);
	}
</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		<h2 class="card-title">API providers</h2>
		<div class="divider m-1"></div>
	</div>

	<div
		class="m-1 grid max-w-screen-xl grid-cols-[10rem,min-content,auto,min-content,min-content,min-content] gap-4 gap-y-2">
		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">Base URL</div>
		<div />
		<div />
		<div />

		{#each providers as provider, i}
			<Provider bind:provider={provider} onDeleteProvider={() => onDeleteProvider(i)} />
		{/each}
		<button
			class="btn btn-circle btn-outline size-12"
			on:click={() => {
				addProvider();
			}}>
			<Plus />
		</button>
	</div>
</div>

<pre>{JSON.stringify(providers, null, 2)}</pre>
