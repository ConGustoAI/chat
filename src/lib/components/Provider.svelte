<script lang="ts">
	import { providerTypes } from '$lib/db/schema';
	import { assert, capitalize } from '$lib/utils';
	import { Check, Plus, Trash2 } from 'lucide-svelte';

	import { deleteKey, upsertProvider } from '$lib/api';

	import { beforeNavigate } from '$app/navigation';
	import ProviderApiKeys from './ProviderApiKeys.svelte';
	import ProviderModels from './ProviderModels.svelte';
	import { deleteModel } from '$lib/api/model';

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

	async function onDelteteAPIKey(p: ProviderInterface, idx: number) {
		status = 'saving';
		const apiKey = p.apiKeys![idx].id;
		p.apiKeys = p.apiKeys!.filter((_, index) => index !== idx);
		if (apiKey) {
			provider = provider;
			await deleteKey(apiKey);
		}
		status = 'saved';
		provider = provider;
	}

	async function onDeleteModel(p: ProviderInterface, idx: number) {
		status = 'saving';
		const modelId = p.models![idx].id;
		p.models = p.models!.filter((_, index) => index !== idx);
		if (modelId) {
			provider = provider;
			await deleteModel(modelId);
		}
		status = 'saved';
		provider = provider;
	}

	async function addModel(p: ProviderInterface) {
		p.models = [
			...(p.models ?? []),
			{
				providerID: p.id!,
				displayName: 'New Model',
				name: '',
				inputContext: 8000,
				images: false,
				prefill: false
			}
		];
		provider = provider;
	}

	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

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
						status = 'saved';
						assert(!provider.id || provider.id === res.id, "Returned provider ID doesn't match");
						provider.id = res.id;
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

	let keysToggled = false;
	let modelToggled = false;
</script>

<input type="text" class="input input-bordered w-full" bind:value={provider.name} on:input={statusChanged} spellcheck="false" />
<select class="select select-bordered w-full" bind:value={provider.type} on:change={statusChanged}>
	{#each types as type}
		<option value={type.value}>{capitalize(type.label)}</option>
	{/each}
</select>
<input type="text" class="input input-bordered w-full" bind:value={provider.baseURL} spellcheck="false" on:change={statusChanged} />

<button class="btn btn-outline w-full" on:click={() => (keysToggled = !keysToggled)}> API Keys </button>
<button class="btn btn-outline w-full" on:click={() => (modelToggled = !modelToggled)}> Models </button>
<button
	class="btn btn-outline"
	on:click={() => {
		status = 'saving';
		onDeleteProvider();
	}}>
	<Trash2 />
</button>

<div class="relative self-center">
	<!-- <div class="absolute">{status}</div> -->
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{statusMessage}</span>
</div>
{#if modelToggled}
	<span />
	<div class="col-span-6 mb-6 w-full">
		<div class="divider">{provider.name} Models</div>
		<div class="grid grid-cols-[15rem,auto,min-content,min-content,min-content,min-content,min-content,min-content,min-content] items-center gap-4 gap-y-2">
			<span class="label-text">Display name</span>
			<span class="label-text">Model name</span>
			<span class="label-text w-full">Input context</span>
			<span class="label-text">Images</span>
			<span class="label-text">Audio</span>
			<span class="label-text">Video</span>
			<span class="label-text">Prefill</span>
			<span />
			<span />

			{#if provider.models}
				{#each provider.models as model, j}
					<ProviderModels bind:model onDeleteModel={() => onDeleteModel(provider, j)} />
				{/each}
			{/if}
			<button
				class="btn btn-outline w-fit"
				on:click={() => {
					addModel(provider);
					status = 'changed';
				}}><Plus />Model</button>
		</div>
	</div>
{/if}

{#if keysToggled}
	<div />
	<div class="col-span-6 mb-6 w-full">
		<div class="divider">{provider.name} API keys</div>
		<div class="grid grid-cols-[15rem,auto,min-content,min-content] items-center gap-4 gap-y-2">
			<span class="label-text">Key label</span>
			<span class="label-text">Key</span>
			<span />
			<span />

			{#if provider.apiKeys}
				{#each provider.apiKeys as key, j}
					<ProviderApiKeys bind:apiKey={key} onDeleteKey={() => onDelteteAPIKey(provider, j)} />
				{/each}
				<button
					class="btn btn-outline min-h-fit w-fit"
					on:click={() => {
						addKey(provider);
						status = 'changed';
					}}><Plus />Key</button>
			{/if}
		</div>
	</div>
{/if}
