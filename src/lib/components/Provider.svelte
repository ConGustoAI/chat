<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIupsertProvider } from '$lib/api';
	import { providerTypes } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import { assert, capitalize } from '$lib/utils';
	import { Check, Copy, Trash2 } from 'lucide-svelte';

	import dbg from 'debug';
	import ApiKeysGrid from './ApiKeysGrid.svelte';
	import ModelsGrid from './ModelsGrid.svelte';
	const debug = dbg('app:ui:components:Provider');

	export let dbUser: UserInterface | undefined;
	export let provider: ProviderInterface;
	export let models: { [key: string]: ModelInterface };
	export let defaultModels: { [key: string]: ModelInterface } = {};
	export let apiKeys: { [key: string]: ApiKeyInterface };
	export let defaultApiKeys: { [key: string]: ApiKeyInterface } = {};
	export let deleteProvider = async (p: ProviderInterface) => {};
	export let edit: boolean;
	export let editingDefault = false;

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
				if (!dbUser) {
					toLogin();
					return;
				}
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

	let showApiKeys = false;
	let showModels = false;
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

<button class="btn btn-outline w-full" class:btn-active={showApiKeys} on:click={() => (showApiKeys = !showApiKeys)}>
	API Keys
</button>
<button class="btn btn-outline w-full" class:btn-active={showModels} on:click={() => (showModels = !showModels)}>
	Models
</button>
<button
	class="btn btn-outline"
	on:click={() => {
		status = 'deleting';
		deleteProvider(provider);
		status = null;
	}}
	disabled={!edit || status === 'deleting'}>
	{#if status === 'deleting'}
		<div class="loading" />
	{:else}
		<Trash2 />
	{/if}
</button>

<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{statusMessage}</span>
</div>

{#if showModels}
	<div class="col-span-full col-start-2 mb-6 flex w-full flex-col gap-4">
		{#if !editingDefault}
			<div class="divider col-span-full w-full">{provider.name}: Your models</div>
			<ModelsGrid {dbUser} {provider} bind:models edit={true} />
		{/if}

		{#if editingDefault || Object.keys(defaultModels).length}
			<div class="flex">
				<div class="divider col-span-full w-full">
					{provider.name}: Default models
					{#if editingDefault}
						<span class="alert alert-warning py-0">Changes made here will be visible to and will affect all users</span>
					{/if}
				</div>
			</div>
			<ModelsGrid {dbUser} {provider} bind:models={defaultModels} edit={editingDefault} addDefault={editingDefault} />
		{/if}
	</div>
{/if}

{#if showApiKeys}
	<div class="col-span-full col-start-2 flex w-full flex-col gap-4">
		{#if !editingDefault}
			<div class="divider col-span-full w-full">{provider.name}: Your API keys</div>
			<ApiKeysGrid {dbUser} {provider} bind:apiKeys edit={true} />
		{/if}

		{#if editingDefault || Object.keys(defaultApiKeys).filter((k) => defaultApiKeys[k].providerID == provider.id).length}
			<div class="flex">
				<div class="divider col-span-full w-full">
					{provider.name}: Default API Keys
					{#if editingDefault}
						<span class="alert alert-error py-0"
							>Only admins can see the Default Key values, but any user can make requests with them</span>
					{/if}
				</div>
			</div>
			<ApiKeysGrid
				{dbUser}
				{provider}
				bind:apiKeys={defaultApiKeys}
				edit={editingDefault}
				addDefault={editingDefault} />
		{/if}
		<div class="divider col-span-full w-full" />
	</div>
{/if}
