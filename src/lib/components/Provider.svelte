<script lang="ts">
	import { providerTypes } from '$lib/db/schema';
	import { Plus, Trash2, SaveAll, Check } from 'lucide-svelte';
	import { getIncrementedName } from '$lib/utils';
	import { capitalize } from '$lib/utils';

	import { upsertProvider, upsertKey, deleteProvider, deleteKey } from '$lib/api-client.js';

	import { beforeNavigate } from '$app/navigation';
	import ProviderApiKeys from './ProviderApiKeys.svelte';

	export let provider: ProviderInterface;
	export let onDeleteProvider;

	let status: string | null = null;
	let statusMessage: string | null = null;
	let updateTimer: number | NodeJS.Timeout;

	// Don't let the user navigate off if changes are unsaved
	let hasUnsavedChanges = false;
	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				navigation.cancel();
			}
		}
	});

	async function addKey(p: ProviderInterface) {
		p.apiKeys = [
			...(p.apiKeys ?? []),
			{
				providerID: p.id!,
				label: 'New Key',
				key: ''
			}
		];
		provider = provider;
	}

	async function delteteAPIKey(p: ProviderInterface, idx: number) {
		console.log('delete key', p, idx);
		if (p.apiKeys![idx].id) {
			// Delete from the database
			provider = provider;
			await deleteKey(p.apiKeys![idx].id);
		}
		p.apiKeys = p.apiKeys!.filter((_, index) => index !== idx);
		provider = provider;
	}

	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

	let key_toggled = false;

	$: {
		debounceProviderUpdate();
		hasUnsavedChanges = !!(status && status != 'saved');
		provider = provider;
	}

	function debounceProviderUpdate() {
		if (status === 'changed') {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(() => {
				status = 'saving';
				upsertProvider(provider)
					.then((res) => {
						console.log(res);
						status = 'saved';
						updateTimer = setTimeout(() => {
							status = null;
						}, 2000);
					})
					.catch((e) => {
						status = 'error';
						statusMessage = e.message;
					})
					.finally(() => {});
			}, 750);
		}
	}

	function statusChanged() {
		status = 'changed';
	}
</script>

<div>
	<input
		type="text"
		class="input input-bordered"
		bind:value={provider.name}
		on:input={statusChanged}
		spellcheck="false" />
</div>
<div>
	<select name="providerType" class="select select-bordered" bind:value={provider.type} on:change={statusChanged}>
		{#each types as type}
			<option value={type.value}>{capitalize(type.label)}</option>
		{/each}
	</select>
</div>
<div>
	<input
		type="text"
		class="input input-bordered w-full"
		bind:value={provider.baseURL}
		spellcheck="false"
		on:change={statusChanged} />
</div>
<button class="btn btn-outline w-32" on:click={() => (key_toggled = !key_toggled)}> API Keys </button>
<div>
	<button
		class="btn btn-outline"
		on:click={() => {
			status = 'saving';
			onDeleteProvider();
		}}>
		<Trash2 />
	</button>
</div>

<div class="relative size-full self-center">
	<!-- <div class="absolute">{status}</div> -->
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{statusMessage}</span>
</div>

{#if key_toggled}
	<div />
	<div class="col-span-5 mb-6">
		<div class="divider">API keys</div>
		<div class="grid grid-cols-[15rem,auto,min-content,min-content] items-end gap-4 gap-y-2">
			<span class="label-text">Key label</span>
			<span class="label-text">Key</span>
			<span />
			<span />

			{#if provider.apiKeys}
				{#each provider.apiKeys as key, j}
					<ProviderApiKeys bind:apiKey={key} onDeleteKey={() => delteteAPIKey(provider, j)} />
				{/each}
				<button
					class="btn btn-circle btn-outline size-8 min-h-fit"
					on:click={() => {
						addKey(provider);
					}}><Plus /></button>
			{/if}
		</div>
	</div>
{/if}
