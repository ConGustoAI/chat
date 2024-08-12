<script lang="ts">
	import { Plus } from 'lucide-svelte';

	import { deleteAssistant, fetchAssistants, fetchProviders } from '$lib/api';
	import { Assistant } from '$lib/components';
	import { onMount } from 'svelte';

	export let data;
	let { dbUser } = data;
	let assistants: AssistantInterface[] = [];
	let providers: ProviderInterface[] = [];
	let models: ModelInterface[] = [];

	onMount(async () => {
		const [fetchedAssistants, fetchedProviders] = await Promise.all([fetchAssistants(), fetchProviders(true, true)]);
		assistants = fetchedAssistants;
		providers = fetchedProviders;
		models = providers.flatMap((p) => p.models ?? []);
		console.log('assistants 2', { assistants, providers, models });
	});

	function addAssistant() {
		console.log('add assistant');
		assistants = [
			...assistants,
			{
				userID: dbUser!.id,
				name: 'New assistant',
				aboutUserFromUser: true,
				assistantInstructionsFromUser: true,
				images: false,
				prefill: false
			}
		];
	}

	async function doDeleteAssistant(idx: number) {
		console.log('delete assistant', idx);
		if (assistants[idx].id) {
			// Delete from the database
			await deleteAssistant(assistants[idx].id);
		}
		assistants = assistants.filter((_, index) => index !== idx);
	}
</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		<h2 class="card-title">Assistants</h2>
	</div>

	<div class="grid min-w-max max-w-screen-xl grid-cols-[10rem,12rem,12rem,auto,6rem,6rem,0] gap-4 gap-y-2">
		<div class="font-bold">Name</div>
		<div class="font-bold">Model</div>
		<div class="font-bold">API key</div>
		<div class="font-bold">Descripton</div>
		<div />
		<div />
		<div />

		{#each assistants as assistant, i}
			<Assistant bind:assistant {models} {providers} {dbUser} {i} onDeleteAssistant={() => doDeleteAssistant(i)} />
		{/each}
		<button class="btn btn-outline w-fit" on:click={addAssistant}>
			<Plus />Assistant
		</button>
	</div>
</div>

<!-- <pre>{JSON.stringify({ assistants, user, models }, null, 2)}</pre> -->
