<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIdeleteKey, APIupsertKey } from '$lib/api';
	import { ApiKey } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	import { Plus } from 'lucide-svelte';

	const debug = dbg('app:ui:components:ApiKeysGrid');

	let {
		provider,
		edit,
		showDefault,
		showCustom,
		newChildUserID
	}: {
		provider: ProviderInterface;
		edit: boolean;
		showDefault: boolean;
		showCustom: boolean;
		newChildUserID: string;
	} = $props();

	let addingKey = $state(false);

	async function addKey() {
		debug('add key');
		if (!A.user || !newChildUserID) {
			await goto('/login', { invalidateAll: true });
		}
		addingKey = true;
		const apiKey = await APIupsertKey({
			userID: newChildUserID,
			providerID: provider.id!,
			label: provider.name + ' Key',
			key: '',
			usage: 0,
			remainder: 0
		});
		A.apiKeys[apiKey.id!] = apiKey;

		addingKey = false;
		debug('new key', apiKey);
	}

	async function deleteKey(apiKey: ApiKeyInterface) {
		debug('delete key', apiKey);
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
		}

		const del = await APIdeleteKey(apiKey);
		delete A.apiKeys[del.id!];
		debug('delete key done', del);
	}
</script>

<div class="flex w-full flex-col gap-4" id="#{provider.id}/keys">
	<div class="grid grid-cols-[15rem,auto,3rem,min-content] items-center gap-4 gap-y-2">
		<span class="text-sm">Key label</span>
		<span class="text-sm">Key</span>
		<span></span>
		<span></span>

		{#each Object.entries(A.apiKeys) as [id, key]}
			{#if key.providerID === provider.id && ((showDefault && key.userID === defaultsUUID) || (showCustom && key.userID !== defaultsUUID))}
				<ApiKey bind:apiKey={A.apiKeys[id]} {deleteKey} {edit} />
			{/if}
		{/each}
	</div>
	{#if edit}
		<button
			class="btn btn-outline min-h-fit w-fit"
			onclick={async () => {
				await addKey();
			}}>
			{#if addingKey}
				<div class="loading"></div>
			{:else}
				<Plus />
			{/if}
			Key</button>
	{/if}
</div>
