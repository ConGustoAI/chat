<script lang="ts">
	import { APIdeleteAssistant, APIupsertAssistant } from '$lib/api';
	import { Assistant } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import dbg from 'debug';
	import { Plus } from 'lucide-svelte';
	const debug = dbg('app:ui:components:AssistantGrid');

	export let assistants: { [key: string]: AssistantInterface } = {};
	export let providers: { [key: string]: ProviderInterface } = {};
	export let models: { [key: string]: ModelInterface } = {};
	export let apiKeys: { [key: string]: ApiKeyInterface } = {};

	export let dbUser: UserInterface | undefined;
	export let edit = false;
	// Add the assistant as a default assistant.
	export let addDefault = false;

	let addingAssistant = false;
	async function addAssistant() {
		debug('add assistant');
		if (!dbUser) {
			toLogin();
			return;
		}
		addingAssistant = true;
		const newAssistant = await APIupsertAssistant({
			userID: addDefault ? defaultsUUID : dbUser.id,
			name: 'New assistant',
			aboutUserFromUser: true,
			assistantInstructionsFromUser: true
		});
		assistants[newAssistant.id!] = newAssistant;
		addingAssistant = false;
		debug('new assistant', newAssistant);
	}

	async function copyAssistant(assistant: AssistantInterface) {
		debug('copy assistant', assistant);
		if (!dbUser) {
			toLogin();
			return;
		}
		const newAssistant = await APIupsertAssistant({
			...assistant,
			id: undefined,
			name: assistant.name + ' (copy)',
			userID: addDefault ? defaultsUUID : dbUser.id
		});
		assistants[newAssistant.id!] = newAssistant;
		debug('copy assistant done', newAssistant);
	}

	async function deleteAssistant(assistant: AssistantInterface) {
		debug('delete assistant', assistant);
		if (!dbUser) {
			toLogin();
			return;
		}
		const del = await APIdeleteAssistant(assistant);
		delete assistants[del.id!];
		assistants = assistants;
		debug('delete assistant done', del);
	}
</script>

<div class="mb-10 flex flex-col gap-4">
	<div class="grid grid-cols-[min-content,10rem,max-content,12rem,auto,6rem,6rem,0] gap-4 gap-y-2">
		<div />
		<div class="font-bold">Name</div>
		<div class="font-bold">Model</div>
		<div class="font-bold">API key</div>
		<div class="font-bold">Descripton</div>
		<div />
		<div />
		<div />

		{#each Object.entries(assistants) as [i, assistant]}
			<Assistant
				{dbUser}
				bind:assistant
				{models}
				{providers}
				{apiKeys}
				deleteAssistant={async () => await deleteAssistant(assistant)}
				copyAssistant={async () => await copyAssistant(assistant)}
				{edit} />
		{/each}
		{#if edit}
			<button
				class="btn btn-outline col-start-2 w-fit"
				disabled={addingAssistant}
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
		{/if}
	</div>
</div>
