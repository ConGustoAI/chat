<script lang="ts">
	import { Plus, SaveAll } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { SpinButton } from '$lib/components';
	export let data;

	import { Assistant } from '$lib/components';

	let { assistants, userData, providers } = data;

	let saving = false;
	let save_message = '';
	let save_success = true;

	$: {
		providers, (save_message = '');
	}

	async function submitData() {
		console.log('submit');
		saving = true;
		const res1 = await fetch('/settings/models/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},

			body: JSON.stringify(providers)
		});

		if (res1.ok) {
			save_message = 'Settings saved successfully';
			save_success = true;
		} else {
			save_message = (await res1.json()).message;
			save_success = false;
		}

		saving = false;
		invalidateAll();
	}
</script>

<div class="gap-1 flex flex-col">
	<div class="divider m-1"></div>
	<div class="div flex gap-2">
		<div>
			<button
				class="btn btn-outline"
				on:click={() => {
					addProvider();
				}}><Plus /> Add assistant</button>
		</div>
		<h2 class="card-title">Assistants</h2>
		<div class="divider m-1"></div>
	</div>

	{#each assistants as assistant, i}
		<Assistant bind:assistant={assistant} providers={providers} />
	{/each}

	<!-- {#each providers as provider, i}
		<ProviderModels bind:provider={provider} />
	{/each} -->

	<SpinButton class="rounded-md mt-10" loading={saving} onClick={submitData} IconComponent={SaveAll}>Save all</SpinButton>
	{#if save_message}
		<div class="alert" class:alert-success={save_success} class:alert-error={!save_success}>
			<span>{save_message}</span>
		</div>
	{/if}
</div>

<pre>{JSON.stringify({assistants, userData, providers}, null, 2)}</pre>
