<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	// import { useChat } from '@ai-sdk/svelte';
	import { readDataStream } from '@ai-sdk/ui-utils';
	import { fetchAssistants, fetchConversations, fetchConversation } from '$lib/api';
	import { DrawerButton, ChatHistory, ChatTitle, ChatMessages, ChatInput } from '$lib/components';
	import { UserCircleIcon, ArrowLeftSquare, ArrowRightSquare, Info, Star, Settings, Smile, Computer, Upload, Send, CornerDownLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let newConversation: ConversationInterface = {
		id: 'new'
	};
	let assistants: AssistantInterface[] = [];
	let conversations: Record<string, ConversationInterface> = { new: newConversation };
	$: conversationOrder = ['new'].concat(Object.keys(conversations));

	// This will fetch the data eventually, but we are ok with the initial empty data.
	onMount(async () => {
		const [fetchedAssistants, fetchedConversations] = await Promise.all([fetchAssistants(), fetchConversations()]);

		console.log('fetchedAssistants', fetchedAssistants);
		console.log('fetchedConversations', fetchedConversations);

		assistants = fetchedAssistants;

		for (const conversation of fetchedConversations) {
			conversations[conversation.id] = { ...conversations[conversation.id], ...conversation };
		}
	});

	let updatingLike = false;
	let drawer_open = true;
	let message = '';
	let chatLoading = false;
	let chatErrors: string[] = [];

	// Either uuid of a conversation, or 'new' for a new conversation.
	$: convId = $page.params.chat ?? 'new';
	$: conversation = conversations[convId];

	function updateConversation(convId: string) {
		if (convId !== 'new') {
			fetchConversation(convId, true).then((data) => (conversations[convId] = { ...conversations[convId], ...data }));
		}
	}
	$: {
		updateConversation(convId);
	}
</script>

<div class="relative flex h-screen w-screen overflow-x-auto">
	<div class="flex max-w-56 flex-col" class:hidden={!drawer_open}>
		<ChatHistory {conversations} id={convId} />
	</div>
	<div class="divider divider-horizontal" class:hidden={!drawer_open} />

	<div class="grow">
		<div class="flex h-screen flex-col">
			<ChatTitle bind:conversation {assistants} bind:updatingLike />

			<div class="flex-1 items-center justify-center overflow-y-auto">
				<ChatMessages bind:conversation displayStyle="markdown" />
			</div>
			<div class="divider" />

			<div class="navbar h-24 bg-base-100">
				<div class="navbar-start max-w-fit">
					<div class="absolute left-3">
						<DrawerButton bind:drawer_open />
					</div>
					{#if !drawer_open}
						<div class="btn btn-circle" style="visibility: hidden;"></div>
					{/if}
				</div>
				<div class="navbar-center grow">
					<ChatInput bind:message bind:conversation />
				</div>
				<div class="navbar-end max-w-fit"></div>
			</div>
			<div class="toast toast-end">
				{#each chatErrors as error, i}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="alert alert-error"
						on:click={() => {
							chatErrors.splice(i, 1);
							chatErrors = chatErrors;
						}}>
						<span>{error}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<pre>{JSON.stringify({ convId, conversation, conversations, assistants }, null, 2)}</pre>
<slot />
