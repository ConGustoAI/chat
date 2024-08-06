<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	// import { useChat } from '@ai-sdk/svelte';
	import { readDataStream } from '@ai-sdk/ui-utils';
	import { fetchAssistants, fetchHistory, fetchConversation } from '$lib/api-client';
	import { DrawerButton, ChatHistory, ChatTitle, ChatMessages, ChatInput } from '$lib/components';
	import {
		UserCircleIcon,
		ArrowLeftSquare,
		ArrowRightSquare,
		Info,
		Star,
		Settings,
		Smile,
		Computer,
		Upload,
		Send,
		CornerDownLeft
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let newConversation: ConversationInterface = {
		id: 'new'
	};
	let assistants: Record<string, AssistantInterface> = {};
	let conversations: Record<string, ConversationInterface> = { new: newConversation };

	// This will fetch the data eventually, but we are ok with the initial empty data.
	onMount(() => {
		fetchAssistants().then((data) => {
			assistants = data;
		});
		fetchHistory().then((data) => {
			for (const [id, conv] of Object.entries(data)) {
				conversations[id] = { ...conversations[id], ...conv };
			}
		});
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
			fetchConversation(convId).then((data) => (conversations[convId] = { ...conversations[convId], ...data }));
		}
	}
	$: {
		updateConversation(convId);
	}

	// async function uploadFiles(e: Event) {
	// 	const target = e.target as HTMLInputElement;
	// 	const files = target.files;
	// 	console.log('UPLOAD files', files);

	// 	if (!files) return;
	// 	const formData = new FormData();
	// 	for (const file of files) {
	// 		formData.append('files', file);
	// 	}

	// 	const response = await fetch('/chat/upload', {
	// 		method: 'POST',
	// 		body: formData
	// 	});

	// 	console.log('UPLOAD response', response);
	// }

	// // $page.data.conversation.like = true;

	// console.log('layout.svelte data', { data });
</script>

<!-- <div class="flex h-screen w-screen flex-col">
	<div class="h-32 bg-gray-100">Fixed</div>
	<div class="flex-1 items-center justify-center overflow-y-auto">
		<ChatMessages bind:conversation={conversation} displayStyle="markdown" />
	</div>
	<div class="h-32 bg-gray-100">Fixed</div>
</div> -->

<div class="relative flex h-screen w-screen overflow-x-auto">
	<div class="flex max-w-56 flex-col" class:hidden={!drawer_open}>
		<ChatHistory conversations={conversations} id={convId} />
	</div>
	<div class="divider divider-horizontal" class:hidden={!drawer_open} />

	<div class="grow">
		<div class="flex h-screen flex-col">
			<!-- <div class="h-32 bg-gray-100">Fixed</div> -->
			<ChatTitle bind:conversation={conversation} assistants={assistants} bind:updatingLike={updatingLike} />

			<slot />
			<div class="flex-1 items-center justify-center overflow-y-auto">
				<ChatMessages bind:conversation={conversation} displayStyle="markdown" />
			</div>
			<div class="divider" />

			<div class="navbar h-24 bg-base-100">
				<div class="navbar-start max-w-fit">
					<div class="absolute left-3">
						<DrawerButton bind:drawer_open={drawer_open} />
					</div>
					{#if !drawer_open}
						<div class="btn btn-circle" style="visibility: hidden;"></div>
					{/if}
				</div>
				<div class="navbar-center grow">
					<ChatInput bind:message={message} bind:conversation={conversation} />
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
