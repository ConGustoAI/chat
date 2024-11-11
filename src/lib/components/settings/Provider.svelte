<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { APIdeleteProvider, APIhideItem, APIunhideItem, APIupsertModel, APIupsertProvider } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { ApiKeysGrid, DeleteButton, ModelsGrid } from '$lib/components';
	import { defaultsUUID, providerTypes } from '$lib/db/schema';
	import { assert, capitalize } from '$lib/utils/utils';
	import { Check, Copy, Eye, EyeOff } from 'lucide-svelte';

	import { page } from '$app/stores';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:Provider');

	let {
		provider = $bindable(),
		edit,
		allowHiding = true,
		showDefaultChildren,
		showCustomChildren,
		editDefaultChildren,
		editCustomChildren,
		newChildUserID,
		newProviderUserID
	}: {
		provider: ProviderInterface;
		edit: boolean;
		allowHiding?: boolean;
		showDefaultChildren: boolean;
		showCustomChildren: boolean;
		editDefaultChildren: boolean;
		editCustomChildren: boolean;
		newChildUserID: string;
		newProviderUserID: string;
	} = $props();

	let status: 'changed' | 'saving' | 'saved' | 'error' | 'deleting' | 'hiding' | 'copying' | null | undefined =
		$state(undefined);
	let errorMessage: string | null = $state(null);
	let updateTimer: ReturnType<typeof setTimeout>|undefined;

	// Don't let the user navigate off if changes are unsaved
	beforeNavigate((navigation) => {
		if (status && status != 'saved') {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				navigation.cancel();
			}
		}
	});

	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

	function updateProviderNow() {
		if (!A.user) {
			goto('/login', { invalidateAll: true });
		}
		if (status !== 'changed') return;
		status = 'saving';
		return APIupsertProvider(provider)
			.then((res) => {
				assert(!provider.id || res.id == provider.id, 'provider ID mismatch');
				provider.id = res.id;
				status = 'saved';
				updateTimer = setTimeout(() => {
					status = null;
				}, 2000);
			})
			.catch((e) => {
				status = 'error';
				errorMessage = e.message;
			});
	}

	function debounceProviderUpdate() {
		debug('debounceProviderUpdate');
		clearTimeout(updateTimer);
		updateTimer = setTimeout(updateProviderNow, 750);
	}

	async function copyProvider(provider: ProviderInterface) {
		debug('copy provider', provider);
		if (!A.user || !newProviderUserID || !newChildUserID) {
			await goto('/login', { invalidateAll: true });
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
		Object.values(A.models).forEach((model) => {
			if (model.providerID === provider.id) {
				if (model.userID === defaultsUUID || (newProviderUserID !== defaultsUUID && model.userID === A.user?.id)) {
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
		insertedModels.forEach((m) => {
			A.models[m.id!] = m;
		});
		A.providers[newProvider.id!] = newProvider;
		debug('copy provider done', { newProvider, newModels });
	}

	async function deleteProvider(provider: ProviderInterface) {
		debug('delete provider', provider);
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
		}

		const del = await APIdeleteProvider(provider);
		debug('delete provider', del);
		delete A.providers[del.id!];
	}

	async function toggleHidden() {
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
			return;
		}

		if (provider.id && allowHiding) {
			if (A.hiddenItems.has(provider.id)) {
				await APIunhideItem(provider.id);
				A.hiddenItems.delete(provider.id);
			} else {
				await APIhideItem(provider.id);
				A.hiddenItems.add(provider.id);
			}
			A.hiddenItems = A.hiddenItems;
		}
	}

	let showApiKeys = $state(false);
	let showModels = $state(false);
	$effect(() => {
		showApiKeys = $page.url.hash == `#${provider.id}/keys`;
		showModels = $page.url.hash == `#${provider.id}/models`;
	});

	let streamUsage = $derived(provider.type !== 'openai' || provider.openAIStreamUsage);

	function streamUsageChanged(e: Event) {
		if (provider.type === 'openai') {
			provider.openAIStreamUsage = (e.target as HTMLInputElement).checked;
			status = 'changed';
			debounceProviderUpdate();
		}
	}

	$inspect(status);
</script>

<button
	id="#{provider.id}"
	class="btn btn-outline"
	onclick={async () => {
		status = 'copying';
		await copyProvider(provider);
		status = null;
	}}
	disabled={status === 'copying'}>
	{#if status === 'copying'}
		<div class="loading"></div>
	{:else}
		<Copy />
	{/if}
</button>

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={provider.name}
	oninput={() => {
		status = 'changed';
		debounceProviderUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateProviderNow();
	}}
	spellcheck="false"
	disabled={!edit} />
<select
	class="select select-bordered w-full"
	bind:value={provider.type}
	onchange={() => {
		status = 'changed';
		debounceProviderUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateProviderNow();
	}}
	disabled={!edit}>
	{#each types as type}
		<option value={type.value}>{capitalize(type.label)}</option>
	{/each}
</select>

<input
	type="checkbox"
	class="checkbox"
	disabled={!edit || provider.type !== 'openai'}
	checked={streamUsage}
	onchange={streamUsageChanged} />

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={provider.baseURL}
	spellcheck="false"
	oninput={() => {
		status = 'changed';
		debounceProviderUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateProviderNow();
	}}
	disabled={!edit} />

<button class="btn btn-outline w-full" class:btn-active={showApiKeys} onclick={() => (showApiKeys = !showApiKeys)}>
	API Keys
</button>
<button class="btn btn-outline w-full" class:btn-active={showModels} onclick={() => (showModels = !showModels)}>
	Models
</button>

<button
	class="btn btn-outline p-2.5"
	disabled={status === 'hiding' || !allowHiding}
	onclick={async () => {
		status = 'hiding';
		await toggleHidden();
		status = null;
	}}>
	{#if status === 'hiding'}
		<div class="loading"></div>
	{:else if A.hiddenItems.has(provider.id ?? '') && allowHiding}
		<EyeOff size="fit-h" />
	{:else}
		<Eye size="fit-h" />
	{/if}
</button>

<DeleteButton
	btnClass="btn btn-outline h-full w-full p-2.5"
	deleteAction={async () => {
		status = 'deleting';
		await deleteProvider(provider);
		status = null;
	}}
	disabled={!edit || status === 'deleting'} />

<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'}></div>
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{errorMessage}</span>
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
		<div class="divider col-span-full w-full"></div>
	</div>
{/if}

{#if showApiKeys}
	<div class="col-span-full col-start-2 flex w-full flex-col items-center gap-4">
		{#if showCustomChildren}
			<div class="divider w-full">{provider.name}: Your API keys</div>
			<ApiKeysGrid {provider} edit={editCustomChildren} showCustom={true} showDefault={false} {newChildUserID} />
		{/if}

		{#if showDefaultChildren && (Object.values(A.apiKeys).filter((v) => v.providerID === provider.id && v.userID === defaultsUUID).length || editDefaultChildren)}
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
		<div class="divider w-full"></div>
	</div>
{/if}
