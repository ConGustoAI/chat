<script lang="ts">
	import { APIdeleteAssistant, APIupsertAssistant } from '$lib/api';
	import { Assistant } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { assistants, dbUser } from '$lib/stores/appstate';
	import { toLogin } from '$lib/stores/loginModal';
	import { Plus } from 'lucide-svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:AssistantGrid');

	export let edit = false;
	export let allowHiding = true;

	// Either show the users assistnts or the default assistants.
	export let showDefault = false;
	export let newItemUserID = defaultsUUID;

	let addingAssistant = false;
	async function addAssistant() {
		debug('add assistant');
		if (!dbUser) {
			toLogin();
			return;
		}
		addingAssistant = true;
		const newAssistant = await APIupsertAssistant({
			userID: newItemUserID,
			name: 'New assistant',
			aboutUserFromUser: true,
			temperature: 0,
			maxTokens: 0,
			topK: 0,
			topP: 0,
			assistantInstructionsFromUser: true
		});
		assistants.update((current) => {
			current[newAssistant.id!] = newAssistant;
			return current;
		});
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
			userID: newItemUserID
		});
		assistants.update((current) => {
			current[newAssistant.id!] = newAssistant;
			return current;
		});
		debug('copy assistant done', newAssistant);
	}

	async function deleteAssistant(assistant: AssistantInterface) {
		debug('delete assistant', assistant);
		if (!dbUser) {
			toLogin();
			return;
		}
		const del = await APIdeleteAssistant(assistant);
		assistants.update((current) => {
			delete current[del.id!];
			return current;
		});
		debug('delete assistant done', del);
	}
</script>

<div class="mb-10 flex flex-col gap-4">
	<div class="grid grid-cols-[min-content,10rem,max-content,12rem,auto,6rem,min-content,min-content,0] gap-4 gap-y-2">
		<div />
		<div class="font-bold">Name</div>
		<div class="font-bold">Model</div>
		<div class="font-bold">API key</div>
		<div class="font-bold">Descripton</div>
		<div />
		<div class="font-bold">Hide</div>
		<div class="font-bold">Delete</div>
		<div />

		{#each Object.entries($assistants) as [i, assistant]}
			{#if (!showDefault && assistant.userID !== defaultsUUID) || (showDefault && assistant.userID === defaultsUUID)}
				<Assistant bind:assistant {deleteAssistant} {copyAssistant} {showDefault} {edit} {allowHiding} />
			{/if}
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
