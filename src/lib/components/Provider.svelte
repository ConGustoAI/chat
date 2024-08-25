<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIdeleteProvider, APIhideItem, APIunhideItem, APIupsertModel, APIupsertProvider } from '$lib/api';
	import { defaultsUUID, providerTypes } from '$lib/db/schema';
	import { apiKeys, dbUser, providers, models, hiddenItems } from '$lib/stores/appstate';
	import { toLogin } from '$lib/stores/loginModal';
	import { assert, capitalize } from '$lib/utils';
	import { Check, Copy, Eye, EyeOff, Trash2 } from 'lucide-svelte';
	import { ApiKeysGrid, DeleteButton, ModelsGrid } from '$lib/components';

	import dbg from 'debug';
	import { page } from '$app/stores';
	const debug = dbg('app:ui:components:Provider');

	export let provider: ProviderInterface;

	export let edit: boolean;
	export let allowHiding = true;

	export let showDefaultChildren: boolean;
	export let showCustomChildren: boolean;

	export let editDefaultChildren: boolean;
	export let editCustomChildren: boolean;

	export let newChildUserID: string | undefined;
	export let newProviderUserID: string | undefined;

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
				if (!$dbUser) {
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

	async function copyProvider(provider: ProviderInterface) {
		debug('copy provider', provider);
		if (!$dbUser || !newProviderUserID || !newChildUserID) {
			toLogin();
			return;
		}

		const newProvider = await APIupsertProvider({
			...provider,
			id: undefined,
			userID: newProviderUserID,
			name: provider.name + ' (copy)'
		});

		let newModels: ModelInterface[] = [];

		// Copy all models associated with the provider.
		// If the new provider is a default provider, only copy the default models.
		// If the new provider is a user provider, copy both default and user models.
		Object.entries($models).forEach(([modelId, model]) => {
			if (model.providerID === provider.id) {
				if (model.userID === defaultsUUID || (newProviderUserID !== defaultsUUID && model.userID === $dbUser.id)) {
					newModels.push({
						...model,
						id: undefined,
						providerID: newProvider.id!,
						userID: newChildUserID
					});
				}
			}
		});

		const insertedModels = await Promise.all(newModels.map((m) => APIupsertModel(m)));
		models.update((current) => {
			insertedModels.forEach((m) => {
				current[m.id!] = m;
			});
			return current;
		});
		providers.update((current) => {
			current[newProvider.id!] = newProvider;
			return current;
		});
		debug('copy provider done', { newProvider, newModels });
	}

	async function deleteProvider(provider: ProviderInterface) {
		debug('delete provider', provider);
		if (!$dbUser) {
			toLogin();
			return;
		}

		const del = await APIdeleteProvider(provider);
		debug('delete provider', del);
		providers.update((current) => {
			delete current[del.id!];
			return current;
		});
	}

	async function toggleHidden() {
		if (!$dbUser) {
			toLogin();
			return;
		}

		if (provider.id && allowHiding) {
			if ($hiddenItems.has(provider.id)) {
				await APIunhideItem(provider.id);
				$hiddenItems.delete(provider.id);
			} else {
				await APIhideItem(provider.id);
				$hiddenItems.add(provider.id);
			}
			$hiddenItems = $hiddenItems;
		}
	}

	function statusChanged() {
		status = 'changed';
	}

	let showApiKeys = false;
	let showModels = false;
	debug(provider, $page.url.hash);
	$: if ($page.url.hash == `#${provider.id}/keys`) showApiKeys = true;
	$: if ($page.url.hash == `#${provider.id}/models`) showModels = true;
</script>

<button
	id="#{provider.id}"
	class="btn btn-outline"
	on:click={async () => {
		status = 'copying';
		await copyProvider(provider);
		status = null;
	}}
	disabled={status === 'copying'}>
	{#if status === 'copying'}
		<div class="loading" />
	{:else}
		<Copy />
	{/if}
</button>

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
	disabled={status === 'hiding' || !allowHiding}
	on:click={async () => {
		status = 'hiding';
		await toggleHidden();
		status = null;
	}}>
	{#if status === 'hiding'}
		<div class="loading" />
	{:else if $hiddenItems.has(provider.id ?? '') && allowHiding}
		<EyeOff />
	{:else}
		<Eye />
	{/if}
</button>

<DeleteButton
	btnClass="btn btn-outline"
	deleteAction={async () => {
		status = 'deleting';
		await deleteProvider(provider);
		status = null;
	}}
	size={24}
	disabled={!edit || status === 'deleting'} />

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
	<div class="col-span-full col-start-2 mb-6 flex w-full flex-col items-center gap-4">
		{#if showCustomChildren}
			<div class="divider col-span-full w-full">{provider.name}: Your models</div>
			<ModelsGrid
				{provider}
				edit={editCustomChildren}
				showCustom={true}
				showDefault={false}
				{newChildUserID}
				{allowHiding} />
		{/if}

		{#if showDefaultChildren}
			<div class="divider col-span-full w-full">
				{provider.name}: Default models
			</div>
			{#if editDefaultChildren}
				<div class="divider w-full">
					<div class="alert alert-warning w-fit py-0">
						Changes made here will be visible to and will affect all users
					</div>
				</div>
			{/if}

			<ModelsGrid
				{provider}
				edit={editDefaultChildren}
				showCustom={false}
				showDefault={true}
				{newChildUserID}
				{allowHiding} />
		{/if}
		<div class="divider col-span-full w-full" />
	</div>
{/if}

{#if showApiKeys}
	<div class="col-span-full col-start-2 flex w-full flex-col items-center gap-4">
		{#if showCustomChildren}
			<div class="divider w-full">{provider.name}: Your API keys</div>
			<ApiKeysGrid {provider} edit={editCustomChildren} showCustom={true} showDefault={false} {newChildUserID} />
		{/if}

		{#if showDefaultChildren && (Object.entries($apiKeys).filter(([k, v]) => v.providerID === provider.id && v.userID === defaultsUUID).length || editDefaultChildren)}
			<div class="divider w-full">
				{provider.name}: Default API Keys
			</div>
			{#if editDefaultChildren}
				<div class="divider w-full">
					<div class="alert alert-error w-fit py-0">
						Only admins can see default keys, but any user can make requests with them
					</div>
				</div>
			{/if}

			<ApiKeysGrid {provider} edit={editDefaultChildren} showCustom={false} showDefault={true} {newChildUserID} />
		{/if}
		<div class="divider w-full" />
	</div>
{/if}
