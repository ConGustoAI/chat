<script lang="ts">
	import {
		APIfetchAssistants,
		APIfetchKeys,
		APIfetchModels,
		APIfetchProviders
	} from '$lib/api';
	import { defaultsUUID } from '$lib/db/schema';
	import { toIdMap } from '$lib/utils';
	import { onMount } from 'svelte';

	import AssistantGrid from '$lib/components/AssistantGrid.svelte';
	import dbg from 'debug';
	const debug = dbg('app:ui:settings:assistants');

	export let data;
	let { dbUser } = data;
	let assistants: { [key: string]: AssistantInterface } = {};
	let defaultAssistants: { [key: string]: AssistantInterface } = {};
	let providers: { [key: string]: ProviderInterface } = {};
	let models: { [key: string]: ModelInterface } = {};
	let apiKeys: { [key: string]: ApiKeyInterface } = {};

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

		assistants = toIdMap(fetchedAssistants.filter((a) => a.userID !== defaultsUUID));
		defaultAssistants = toIdMap(fetchedAssistants.filter((a) => a.userID === defaultsUUID));
		loading = false;
		debug('onMount', { assistants, providers, models });
	});

</script>

<div class="flex flex-col gap-1">
	<div class="div flex gap-2">
		<h2 class="card-title">Assistants</h2>
		{#if loading}
			<div class="loading" />
		{/if}
	</div>

	<div class=" max-w-screen-xl">
		<div class="divider w-full">Your assistants</div>
		<AssistantGrid {dbUser} {assistants} {models} {providers} {apiKeys} edit={!loading}/>

		<div class="divider w-full">Default assistants</div>
		<AssistantGrid {dbUser} assistants={defaultAssistants} {models} {providers} {apiKeys} edit={false}/>
	</div>
</div>
