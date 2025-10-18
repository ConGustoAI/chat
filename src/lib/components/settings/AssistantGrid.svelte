<script lang="ts">
	import { APIdeleteAssistant, APIupsertAssistant } from '$lib/api';
	import { Assistant } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { A } from '$lib/appstate.svelte';
	import { Plus } from 'lucide-svelte';

	import dbg from 'debug';
	import { goto } from '$app/navigation';
	const debug = dbg('app:ui:components:AssistantGrid');

	let {
		edit = false,
		allowHiding = true,
		showDefault = false,
		newItemUserID = defaultsUUID
	}: {
		edit?: boolean;
		allowHiding?: boolean;
		showDefault?: boolean;
		newItemUserID?: string;
	} = $props();

	let addingAssistant = $state(false);
	async function addAssistant() {
		debug('add assistant');
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
		}
		addingAssistant = true;
		const newAssistant = await APIupsertAssistant({
			userID: newItemUserID,
			name: 'New assistant',
			aboutUserFromUser: true,
			temperature: 0,
			temperature_enabled: true,
			maxTokens: 0,
			topK: 0,
			topP: 0,
			assistantInstructionsFromUser: true
		});
		A.assistants[newAssistant.id!] = newAssistant;
		addingAssistant = false;
		debug('new assistant', newAssistant);
	}

	async function copyAssistant(assistant: AssistantInterface) {
		debug('copy assistant', assistant);
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
		}
		const newAssistant = await APIupsertAssistant({
			...assistant,
			id: undefined,
			name: assistant.name + ' (copy)',
			userID: newItemUserID
		});
		A.assistants[newAssistant.id!] = newAssistant;
		debug('copy assistant done', newAssistant);
	}

	async function deleteAssistant(assistant: AssistantInterface) {
		debug('delete assistant', assistant);
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
		}
		const del = await APIdeleteAssistant(assistant);
		delete A.assistants[del.id!];
		debug('delete assistant done', del);
	}
</script>

<div class="mb-10 flex w-full flex-col gap-4">
	<div class="grid w-full grid-cols-[min-content,10rem,15rem,12rem,auto,6rem,3rem,3rem,0] gap-4 gap-y-2">
		<div></div>
		<div class="font-bold">Name</div>
		<div class="font-bold">Model</div>
		<div class="font-bold">API key</div>
		<div class="font-bold">Descripton</div>
		<div></div>
		<div class="font-bold">Hide</div>
		<div class="font-bold">Delete</div>
		<div></div>

		{#each Object.entries(A.assistants) as [i, assistant]}
			{#if (!showDefault && assistant.userID !== defaultsUUID) || (showDefault && assistant.userID === defaultsUUID)}
				<Assistant
					bind:assistant={A.assistants[i]}
					{deleteAssistant}
					{copyAssistant}
					{showDefault}
					{edit}
					{allowHiding} />
			{/if}
		{/each}
		{#if edit}
			<button
				class="btn btn-outline col-start-2 w-fit"
				disabled={addingAssistant}
				onclick={async () => {
					await addAssistant();
				}}>
				{#if addingAssistant}
					<div class="loading"></div>
				{:else}
					<Plus />
				{/if}
				Assistant
			</button>
		{/if}
	</div>
</div>
