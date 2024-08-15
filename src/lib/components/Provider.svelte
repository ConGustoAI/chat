<script lang="ts">
	import { defaultsUUID, providerTypes } from '$lib/db/schema';
	import { assert, capitalize } from '$lib/utils';
	import { Check, Plus, Trash2 } from 'lucide-svelte';

	import { APIdeleteKey, APIupsertKey, APIupsertProvider } from '$lib/api';

	import { beforeNavigate } from '$app/navigation';
	import ProviderApiKeys from './ProviderApiKeys.svelte';
	import ProviderModels from './ProviderModels.svelte';
	import { APIdeleteModel, APIupsertModel } from '$lib/api/model';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:Provider');

	export let dbUser: UserInterface;
	export let provider: ProviderInterface;
	export let models: { [key: string]: ModelInterface };
	export let defaultModels: { [key: string]: ModelInterface } = {};
	export let apiKeys: { [key: string]: ApiKeyInterface };
	export let defaultApiKeys: { [key: string]: ApiKeyInterface } = {};
	export let onDeleteProvider;
	export let edit: boolean;
	export let editDefaults: boolean;

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

	let addingKey = false;
	async function addKey(p: ProviderInterface) {
		debug('add key');
		addingKey = true;
		const apiKey = await APIupsertKey({
			userID: dbUser.id,
			providerID: p.id!,
			label: 'New Key',
			key: ''
		});
		apiKeys[apiKey.id!] = apiKey;
		addingKey = false;
		debug('new key', apiKey);
	}

	async function delteteAPIKey(apiKey: ApiKeyInterface) {
		debug('delete key', apiKey);
		const del = await APIdeleteKey(apiKey);
		delete apiKeys[del.id!];
		debug('delete key done', del);
	}

	let addingModel = false;
	async function addModel() {
		debug('add model');
		addingModel = true;
		const newModel = await APIupsertModel({
			userID: dbUser.id,
			providerID: provider.id!,
			displayName: 'New Model',
			name: '',
			inputContext: 8000,
			images: false,
			prefill: false
		});
		models[newModel.id!] = newModel;
		addingModel = false;
		debug('new model', newModel);
	}

	async function deleteModel(model: ModelInterface) {
		debug('delete model', model);
		const del = await APIdeleteModel(model);
		delete models[del.id!];
		debug('delete model done', del);
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
				APIupsertProvider(provider)
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

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={provider.name}
	on:input={statusChanged}
	spellcheck="false"
	disabled={!edit} />
<select class="select select-bordered w-full" bind:value={provider.type} on:change={statusChanged} disabled={!edit}>
	{#each types as type}
		<option value={type.value}>{capitalize(type.label)}</option>
	{/each}
</select>
<input
	type="text"
	class="input input-bordered w-full"
	bind:value={provider.baseURL}
	spellcheck="false"
	on:change={statusChanged}
	disabled={!edit} />

<button class="btn btn-outline w-full" class:btn-active={keysToggled} on:click={() => (keysToggled = !keysToggled)}>
	API Keys
</button>
<button class="btn btn-outline w-full" class:btn-active={modelToggled} on:click={() => (modelToggled = !modelToggled)}>
	Models
</button>
<button
	class="btn btn-outline"
	on:click={() => {
		status = 'deleting';
		onDeleteProvider();
	}}
	disabled={!edit || status === 'deleting'}>
	{#if status === 'deleting'}
		<div class="loading" />
	{:else}
		<Trash2 />
	{/if}
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
		{#if !editDefaults}
			<div
				class="grid grid-cols-[15rem,auto,min-content,min-content,min-content,min-content,min-content,min-content,min-content] items-center gap-4 gap-y-2">
				<div class="divider col-span-full w-full">Your {provider.name} models</div>
				<span class="label-text">Display name</span>
				<span class="label-text">Model name</span>
				<span class="label-text w-full">Input context</span>
				<span class="label-text">Images</span>
				<span class="label-text">Audio</span>
				<span class="label-text">Video</span>
				<span class="label-text">Prefill</span>
				<span />
				<span />

				{#each Object.entries(models) as [id, model]}
					{#if model.providerID === provider.id}
						<ProviderModels bind:model onDeleteModel={async () => await deleteModel(model)} edit={true} />
					{/if}
				{/each}

				<button
					class="btn btn-outline w-fit"
					on:click={async () => {
						await addModel();
					}}>
					{#if addingModel}
						<div class="loading" />
					{:else}
						<Plus />
					{/if}
					Model
				</button>
			</div>
		{/if}
		{#if Object.keys(defaultModels).length}
			<div
				class="grid grid-cols-[15rem,auto,min-content,min-content,min-content,min-content,min-content,min-content,min-content] items-center gap-4 gap-y-2">
				<div class="divider col-span-full w-full">Default {provider.name} models</div>
				<span class="label-text">Display name</span>
				<span class="label-text">Model name</span>
				<span class="label-text w-full">Input context</span>
				<span class="label-text">Images</span>
				<span class="label-text">Audio</span>
				<span class="label-text">Video</span>
				<span class="label-text">Prefill</span>
				<span />
				<span />

				{#each Object.entries(defaultModels) as [id, model]}
					{#if model.providerID === provider.id}
						<ProviderModels bind:model onDeleteModel={() => {}} edit={editDefaults} />
					{/if}
				{/each}
				{#if editDefaults}
					<button
						class="btn btn-outline w-fit"
						on:click={async () => {
							await addModel();
						}}>
						{#if addingModel}
							<div class="loading" />
						{:else}
							<Plus />
						{/if}
						Model
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#if keysToggled}
	<div />
	<div class="col-span-6 mb-6 w-full">
		{#if !editDefaults}
			<div class="grid grid-cols-[15rem,auto,min-content,min-content] items-center gap-4 gap-y-2">
				<div class="divider col-span-full w-full">Your {provider.name} API keys</div>

				<span class="label-text">Key label</span>
				<span class="label-text">Key</span>
				<span />
				<span />

				{#each Object.entries(apiKeys) as [id, key]}
					{#if key.providerID === provider.id}
						<ProviderApiKeys bind:apiKey={key} onDeleteKey={() => delteteAPIKey(key)} edit={true} />
					{/if}
				{/each}
				<button
					class="btn btn-outline min-h-fit w-fit"
					on:click={async () => {
						await addKey(provider);
					}}>
					{#if addingKey}
						<div class="loading" />
					{:else}
						<Plus />
					{/if}
					Key</button>
			</div>
		{/if}

		{#if Object.keys(defaultApiKeys).length}
			<div />
			<div class="col-span-6 grid grid-cols-[15rem,auto,min-content,min-content] items-center gap-4 gap-y-2">
				<div class="divider col-span-full w-full">Default {provider.name} API keys</div>
				<span class="label-text">Key label</span>
				<span class="label-text">Key</span>
				<span />
				<span />

				{#each Object.entries(defaultApiKeys) as [id, key]}
					{#if key.providerID === provider.id}
						<ProviderApiKeys bind:apiKey={key} onDeleteKey={() => {}} edit={editDefaults} />
					{/if}
				{/each}
				{#if editDefaults}
					<button
						class="btn btn-outline min-h-fit w-fit"
						on:click={async () => {
							await addKey(provider);
						}}>
						{#if addingKey}
							<div class="loading" />
						{:else}
							<Plus />
						{/if}
						Key</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}
