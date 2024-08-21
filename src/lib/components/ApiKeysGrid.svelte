<script lang="ts">
	import { APIdeleteKey, APIupsertKey } from '$lib/api';
	import { ApiKey } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { apiKeys, dbUser } from '$lib/stores/appstate';
	import { toLogin } from '$lib/stores/loginModal';
	import dbg from 'debug';
	import { Plus } from 'lucide-svelte';

	const debug = dbg('app:ui:components:ApiKeysGrid');

	export let provider: ProviderInterface;

	export let edit;
	export let showDefault: boolean;
	export let showCustom: boolean;

	export let newChildUserID: string | undefined;

	let addingKey = false;
	async function addKey() {
		debug('add key');
		if (!$dbUser || !newChildUserID) {
			toLogin();
			return;
		}
		addingKey = true;
		const apiKey = await APIupsertKey({
			userID: newChildUserID,
			providerID: provider.id!,
			label: 'New Key',
			key: ''
		});
		apiKeys.update((current) => {
			current[apiKey.id!] = apiKey;
			return current;
		});
		addingKey = false;
		debug('new key', apiKey);
	}

	async function deleteKey(apiKey: ApiKeyInterface) {
		debug('delete key', apiKey);
		if (!$dbUser) {
			toLogin();
			return;
		}

		const del = await APIdeleteKey(apiKey);
		apiKeys.update((current) => {
			delete current[del.id!];
			return current;
		});
		debug('delete key done', del);
	}
</script>

<div class="flex flex-col gap-4 w-full">
	<div class="grid grid-cols-[15rem,auto,min-content,min-content] items-center gap-4 gap-y-2">
		<span class="label-text">Key label</span>
		<span class="label-text">Key</span>
		<span />
		<span />

		{#each Object.entries($apiKeys) as [id, key]}
			{#if key.providerID === provider.id && ((showDefault && key.userID === defaultsUUID) || (showCustom && key.userID !== defaultsUUID))}
				<ApiKey bind:apiKey={key} {deleteKey} {edit} />
			{/if}
		{/each}
	</div>
	{#if edit}
		<button
			class="btn btn-outline min-h-fit w-fit"
			on:click={async () => {
				await addKey();
			}}>
			{#if addingKey}
				<div class="loading" />
			{:else}
				<Plus />
			{/if}
			Key</button>
	{/if}
</div>
