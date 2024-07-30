<script lang="ts">
	import { providerTypes } from '$lib/db/schema';
	import { Plus, Trash2, SaveAll } from 'lucide-svelte';
	import { getIncrementedName } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import { SpinButton } from '$lib/components';
	export let data;

	import { ProviderApiKeys } from '$lib/components';

	let providers = data.providers as ProviderApiKeysInterface[];

	let saving = false;
	let save_message = '';
	let save_success = true;

	$: {
		providers, (save_message = '');
	}

	async function submitData() {
		console.log('submit');
		saving = true;
		// const { id, name, type, baseURL } = provider;
		const res1 = await fetch('/settings/providers/', {
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

	function addProvider() {
		console.log('add provider');
		const newName = getIncrementedName(
			'Untitled Provider ',
			providers.map((p) => p.name)
		);

		providers = [{ name: newName, type: 'openai', baseURL: '', apiKeys: [] }, ...providers];
		// Check the first radio input with name "providers"
	}

	function delteteAPIKey(provider: (typeof data.providers)[0], i: number) {
		console.log('delete key', provider, i);
		provider.apiKeys = provider.apiKeys.filter((_, index) => index !== i);
		providers = providers;
	}

	function onDeleteProvider(idx: number) {
		console.log('delete provider', idx);
		providers = providers.filter((_, index) => index !== idx);
	}
</script>

<div class="gap-1 flex flex-col">
	<div class="div flex gap-2">
		<div>
			<button
				class="btn btn-outline"
				on:click={() => {
					addProvider();
				}}><Plus /> Add API Provider</button>
		</div>
		<h2 class="card-title">API providers</h2>
		<div class="divider m-1"></div>
	</div>

	{#each providers as provider, i}
		<ProviderApiKeys bind:provider={provider} onDeleteProvider={() => onDeleteProvider(i)} />
	{/each}

	<SpinButton class="rounded-md mt-10" loading={saving} onClick={submitData} IconComponent={SaveAll}>Save all</SpinButton>
	{#if save_message}
		<div class="alert" class:alert-success={save_success} class:alert-error={!save_success}>
			<span>{save_message}</span>
		</div>
	{/if}
</div>
