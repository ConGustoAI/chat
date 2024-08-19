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
	import { AssistantGrid } from '$lib/components';
	import { onMount } from 'svelte';
	import { defaultsUUID } from '$lib/db/schema';
	import { toIdMap } from '$lib/utils';

	import dbg from 'debug';
	import { toLogin } from '$lib/stores/loginModal.js';
	const debug = dbg('app:ui:settings:admin:assistants');

	export let data;
	let { dbUser } = data;

	let defaultAssistants: { [key: string]: AssistantInterface } = {};
	let defaultProviders: { [key: string]: ProviderInterface } = {};
	let defaultModels: { [key: string]: ModelInterface } = {};
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

		defaultAssistants = toIdMap(fetchedAssistants.filter((a) => a.userID === defaultsUUID));
		defaultProviders = toIdMap(fetchedProviders.filter((a) => a.userID === defaultsUUID));
		defaultModels = toIdMap(fetchedModels.filter((a) => a.userID === defaultsUUID));
		defaultApiKeys = toIdMap(fetchedApiKeys.filter((a) => a.userID === defaultsUUID));
		loading = false;
		debug('onMount', { defaultAssistants, defaultProviders, defaultModels, defaultApiKeys });
	});
</script>

<div class="flex max-w-screen-xl flex-col gap-4">
	<div class="div flex gap-4">
		<div class="flex w-fit items-center gap-4 text-nowrap font-bold">
			<span class="text-xl">Default Assistants</span>
			<span class="alert alert-warning py-0">Changes made here will be visible to and will affect all users</span>
		</div>
		{#if loading}
			<div class="loading" />
		{/if}
	</div>

	<div class="divider mt-10 w-full"></div>

	<div class="div flex grow">
		<AssistantGrid
			{dbUser}
			bind:providers={defaultProviders}
			bind:assistants={defaultAssistants}
			models={defaultModels}
			apiKeys={defaultApiKeys}
			edit={true}
			addDefault={true} />
	</div>
</div>
