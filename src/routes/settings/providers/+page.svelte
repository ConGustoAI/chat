<script lang="ts">
	import { Plus } from 'lucide-svelte';

	import { Provider } from '$lib/components';

	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { deleteProvider, fetchProviders } from '$lib/api';

	let providers: ProviderInterface[] = [];

	onMount(async () => {
		providers = await fetchProviders(true, true);
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
	</div>

	<div class="grid min-w-max max-w-screen-xl grid-cols-[10rem,8rem,auto,6rem,6rem,4rem,0] gap-4 gap-y-2">
		<div class="font-bold">Label</div>
		<div class="font-bold">Type</div>
		<div class="font-bold">Base URL</div>
		<div />
		<div />
		<div />
		<div />

		{#each providers as provider, i}
			<Provider bind:provider={provider} onDeleteProvider={() => onDeleteProvider(i)} />
		{/each}
		<button
			class="btn btn-outline w-fit"
			on:click={() => {
				addProvider();
			}}>
			<Plus />Provider
		</button>
	</div>
</div>

<!-- <pre>{JSON.stringify(providers, null, 2)}</pre> -->
