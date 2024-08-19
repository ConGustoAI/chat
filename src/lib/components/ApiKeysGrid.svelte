<script lang="ts">
	import { APIdeleteKey, APIupsertKey } from '$lib/api';
	import { ApiKey } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import { Plus } from 'lucide-svelte';
	import dbg from 'debug';

	const debug = dbg('app:ui:components:ModelsGrid');

	export let apiKeys: { [key: string]: ApiKeyInterface } = {};
	export let provider: ProviderInterface;
	export let dbUser: UserInterface | undefined;
	export let edit = false;
	export let addDefault = false;

	let addingKey = false;
	async function addKey(p: ProviderInterface) {
		debug('add key');
		if (!dbUser) {
			toLogin();
			return;
		}
		addingKey = true;
		const apiKey = await APIupsertKey({
			userID: addDefault ? defaultsUUID : dbUser.id,
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
		if (!dbUser) {
			toLogin();
			return;
		}

		const del = await APIdeleteKey(apiKey);
		delete apiKeys[del.id!];
		apiKeys = apiKeys;

		debug('delete key done', del);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="grid grid-cols-[15rem,auto,min-content,min-content] items-center gap-4 gap-y-2">
		<span class="label-text">Key label</span>
		<span class="label-text">Key</span>
		<span />
		<span />

		{#each Object.entries(apiKeys) as [id, key]}
			{#if key.providerID === provider.id}
				<ApiKey {dbUser} bind:apiKey={key} deleteKey={async () => await delteteAPIKey(key)} {edit} />
			{/if}
		{/each}
	</div>
	{#if edit}
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
