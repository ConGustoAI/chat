<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import {
		APIdeleteAssistant,
		APIfetchAssistants,
		APIfetchKeys,
		APIfetchModels,
		APIfetchProviders,
		APIupsertAssistant
	} from '$lib/api';
	import { Assistant } from '$lib/components';
	import { onMount } from 'svelte';
	import { defaultsUUID } from '$lib/db/schema';
	import { toIdMap } from '$lib/utils';

	import dbg from 'debug';
	import { toLogin } from '$lib/stores/loginModal.js';
	const debug = dbg('app:ui:settings:admin:assistants');

	export let data;
	let { dbUser } = data;
	// let assistants: { [key: string]: AssistantInterface } = {};
	let defaultAssistants: { [key: string]: AssistantInterface } = {};
	let providers: { [key: string]: ProviderInterface } = {};
	let defaultProviders: { [key: string]: ProviderInterface } = {};
	let models: { [key: string]: ModelInterface } = {};
	let defaultModels: { [key: string]: ModelInterface } = {};
	let apiKeys: { [key: string]: ApiKeyInterface } = {};
	let defaultApiKeys: { [key: string]: ApiKeyInterface } = {};

	let loading = false;
	onMount(async () => {
		debug('onMount');
		loading = true;
		const [fetchedAssistants, fetchedProviders, fetchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchAssistants(),
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		providers = toIdMap(fetchedProviders);
		models = toIdMap(fetchedModels);
		apiKeys = toIdMap(fetchedApiKeys);

		defaultAssistants = toIdMap(fetchedAssistants.filter((a) => a.userID === defaultsUUID));
		defaultProviders = toIdMap(fetchedProviders.filter((a) => a.userID === defaultsUUID));
		defaultModels = toIdMap(fetchedModels.filter((a) => a.userID === defaultsUUID));
		defaultApiKeys = toIdMap(fetchedApiKeys.filter((a) => a.userID === defaultsUUID));
		loading = false;
		debug('onMount', { defaultAssistants, providers, models });
	});

	let addingAssistant = false;
	async function addAssistant() {
		debug('add assistant');
		if (!dbUser) {
			toLogin();
			return;
		}

		addingAssistant = true;
		const newAssistant = await APIupsertAssistant({
			userID: defaultsUUID,
			name: 'New assistant',
			aboutUserFromUser: true,
			assistantInstructionsFromUser: true
		});
		defaultAssistants[newAssistant.id!] = newAssistant;
		addingAssistant = false;
		debug('new assistant', newAssistant);
	}

	async function doDeleteAssistant(assistant: AssistantInterface) {
		debug('delete assistant', assistant);
		if (!dbUser) {
			toLogin();
			return;
		}

		const del = await APIdeleteAssistant(assistant);
		delete defaultAssistants[del.id!];
		defaultAssistants = defaultAssistants;
		debug('delete assistant done', del);
	}
</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		<h2 class="card-title text-nowrap">
			<div class="alert alert-warning w-fit">
				<span>Default Assistants. Changes made here will be visible to and will affect all users</span>
			</div>
		</h2>
		{#if loading}
			<div class="loading" />
		{/if}
	</div>

	<div class="grid min-w-max max-w-screen-xl grid-cols-[10rem,16rem,12rem,auto,6rem,6rem,0] gap-4 gap-y-2">
		<div class="font-bold">Name</div>
		<div class="font-bold">Model</div>
		<div class="font-bold">API key</div>
		<div class="font-bold">Descripton</div>
		<div />
		<div />
		<div />

		{#each Object.entries(defaultAssistants) as [idx, assistant]}
			<Assistant
				{dbUser}
				bind:assistant
				{models}
				{providers}
				{apiKeys}
				deleteAssistant={() => doDeleteAssistant(assistant)}
				edit={true} />
		{/each}
		<button
			class="btn btn-outline w-fit"
			disabled={addingAssistant || loading}
			on:click={async () => {
				await addAssistant();
			}}>
			{#if addingAssistant}
				<div class="loading" />
			{:else}
				<Plus />
			{/if}
			Assistant
		</button>
	</div>
</div>

<!-- <pre>{JSON.stringify({ assistants, user, models }, null, 2)}</pre> -->
