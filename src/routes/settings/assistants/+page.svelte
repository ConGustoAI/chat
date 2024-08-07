<script lang="ts">
	import { Plus, SaveAll } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { SpinButton } from '$lib/components';

	import { Assistant } from '$lib/components';
	import { onMount } from 'svelte';
	import { deleteAssistant, fetchAssistants, fetchProviders, fetchUser } from '$lib/api';

	let assistants: AssistantInterface[] = [];
	let providers: ProviderInterface[] = [];
	let user: UserInterface | undefined;
	let models: ModelInterface[] = [];

	onMount(async () => {
		const [fetchedAssistants, fetchedProviders, fetchedUser] = await Promise.all([
			fetchAssistants(),
			fetchProviders(true, true),
			fetchUser()
		]);
		assistants = fetchedAssistants;
		providers = fetchedProviders;
		user = fetchedUser;
		models = providers.flatMap((p) => p.models ?? []);
		console.log('assistants 2', { assistants, providers, user, models });
	});

	function addAssistant() {
		console.log('add assistant');
		assistants = [
			...assistants,
			{
				userID: user!.id,
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
			<Assistant bind:assistant {models} {providers} {user} {i} onDeleteAssistant={() => doDeleteAssistant(i)} />
		{/each}
		<button class="btn btn-outline w-fit" on:click={addAssistant}>
			<Plus />Assistant
		</button>
	</div>
</div>

<!-- <pre>{JSON.stringify({ assistants, user, models }, null, 2)}</pre> -->
