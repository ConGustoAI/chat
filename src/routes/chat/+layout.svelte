<script lang="ts">
	import { goto, pushState, onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { fetchAssistants, fetchConversation, fetchConversations, fetchUser } from '$lib/api';
	import { ChatHistory, ChatInput, ChatMessage, ChatTitle, DrawerButton } from '$lib/components';
	import { errorToMessage, newConversation } from '$lib/utils';
	import { readDataStream } from 'ai';
	import { ChevronUp, Copy, Edit, Repeat } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let assistants: AssistantInterface[] = [];
	let conversations: Record<string, ConversationInterface> = {};
	let conversationOrder: string[] = [];
	let user: UserInterface | undefined;
	let conversation: ConversationInterface | undefined;
	let updatingLike = false;
	let drawer_open = true;
	let chatLoading = false;
	let chatError: string | undefined;

	// This will fetch the data eventually, but we are ok with the initial empty data.
	onMount(async () => {
		chatLoading = true;
		let fetchedConversations: ConversationInterface[];
		[user, assistants, fetchedConversations] = await Promise.all([
			fetchUser(),
			fetchAssistants(),
			fetchConversations()
		]);
		if (conversation && !conversation.id) {
			conversation.assistant = user.assistant ?? assistants[0]?.id ?? undefined;
		}
		for (const conversation of fetchedConversations) {
			if (!conversation.id) throw new Error('The conversation ID is missing.');
			conversations[conversation.id] = { ...conversations[conversation.id], ...conversation };
		}
		conversationOrder = Object.keys(conversations);
		conversation = conversations[$page.params.chat] ?? newConversation();
		chatLoading = false;
	});

	// Either uuid of a conversation, or undefined for a new conversation
	// let convId: string | undefined;

	function updateConversation(convId: string) {
		console.log('updateConversation', convId);
		if (convId) {
			// If the message is already loaded, use it, btut still fetch the updated version just in case.
			if (conversations[convId]) conversation = conversations[convId];

			chatLoading = true;
			fetchConversation(convId, true)
				.then((data) => {
					conversations[data.id!] = { ...conversations[data.id!], ...data };
					conversation = conversations[data.id!];
				})
				.catch((e) => {
					console.error('Failed to fetch conversation', e);
					chatError = 'Failed to fetch conversation:' + errorToMessage(e);
				})
				.finally(() => {
					chatLoading = false;
				});
		} else {
			if (conversation && !conversation.id && !conversation.assistant) {
				conversation.assistant = user?.assistant ?? assistants[0]?.id ?? undefined;
			}
		}
	}
	$: {
		updateConversation($page.params.chat);
	}

	async function submitConversation(toDelete?: string[]) {
		console.log('submitConversation', conversation);
		if (!conversation) throw new Error('The conversation is missing.');
		if (!conversation.assistant) throw new Error('No assistant assigned.');
		if (!conversation.messages) throw new Error('The conversation messages are missing.');

		const toSend = conversation.messages;

		if (toSend.length < 2) throw new Error('The conversation should have at least 2 messages.');
		if (toSend[toSend.length - 2].role !== 'user') throw new Error('The first message should be from the user.');
		if (toSend[toSend.length - 1].role !== 'assistant') {
			throw new Error('The last message should be from the assistant.');
		}

		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ conversation, toDelete })
		});
		console.log('submitConversation POST:', res);

		if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to submit the conversation.');
		if (!res.body) throw new Error('The response body is empty.');

		const reader = res.body.getReader();

		for await (const { type, value } of readDataStream(reader)) {
			console.log('readDataStream', type, value);
			if (type === 'text') {
				conversation.messages[conversation.messages.length - 1].text += value;
			}
			if (type === 'finish_message') {
			}
			if (type === 'data') {
				console.log('data', value);

				for (const dataPart of value) {
					if (typeof dataPart === 'object' && dataPart !== null) {
						if (!conversation.messages) throw new Error('The conversation messages are missing??');
						if ('conversationId' in dataPart) {
							if (typeof dataPart.conversationId !== 'string') throw new Error('The conversation ID is not a string.');
							if (conversation.id && conversation.id != dataPart.conversationId)
								throw new Error('The conversation ID does not match.');

							conversation.id = dataPart.conversationId as string;
							if (!conversations[conversation.id]) {
								conversations[conversation.id] = conversation;
								conversationOrder = [conversation.id, ...conversationOrder];
							}
						}
						if ('userMessage' in dataPart) {
							// TS is being silly a bit
							Object.assign(
								conversation.messages[conversation.messages.length - 2],
								dataPart.userMessage as unknown as MessageInterface
							);
						}
						if ('assistantMessage' in dataPart) {
							// TS is being silly a bit
							Object.assign(
								conversation.messages[conversation.messages.length - 1],
								dataPart.assistantMessage as unknown as MessageInterface
							);
						}
					}
				}
				conversation = conversation;
			}
			if (type === 'error') {
				throw new Error(value);
			}
		}
	}

	let dropdownElement: HTMLDetailsElement;

	function NewChat(assistantId?: string) {
		dropdownElement.open = false;
		conversation = newConversation(assistantId);
		goto('/chat');
		// pushState('/chat', { replaceState: false });
	}
</script>

<main class="relative flex h-screen w-screen overflow-hidden">
	<div class="m-2 flex w-56 shrink-0 flex-col gap-4" class:hidden={!drawer_open}>
		<div class="flex w-full">
			<button class="btn btn-primary grow" on:click={() => NewChat(user?.assistant)}>New chat</button>
			<details class="dropdown dropdown-end my-0 h-full" bind:this={dropdownElement}>
				<summary class="btn btn-primary mx-1 border border-l-2 p-1"><ChevronUp class="rotate-180" /></summary>
				<ul class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow">
					{#each assistants as assistant}
						<button class="btn btn-primary w-full" on:click={() => NewChat(assistant.id)}>{assistant.name}</button>
					{/each}
				</ul>
			</details>
		</div>

		<input type="text" placeholder="Search chats..." class="input input-bordered w-full" />
		<ChatHistory {conversation} {conversations} {conversationOrder} />
	</div>
	<div class="divider divider-horizontal w-1 shrink-0" class:hidden={!drawer_open} />

	<div class="mx-0 grow">
		<div class="flex h-full max-h-screen flex-col">
			<ChatTitle {chatLoading} bind:conversation {assistants} bind:updatingLike />

			<div class="grow overflow-y-scroll">
				{#if conversation?.messages}
					{#each conversation.messages as m}
						<ChatMessage bind:conversation bind:message={m} {submitConversation} />
					{/each}
				{/if}
			</div>
			<!-- <div class="divider w-full" /> -->

			<div class="navbar min-h-24 shrink-0 p-4">
				<div class="navbar-start max-w-fit">
					<!-- Relative to the main element of the page -->
					<div class="absolute bottom-6 left-3">
						<DrawerButton bind:drawer_open />
					</div>
					{#if !drawer_open}
						<div class="btn btn-circle" style="visibility: hidden;"></div>
					{/if}
				</div>
				<div class="navbar-center mx-auto max-w-[95%] grow p-0">
					<ChatInput bind:conversation {submitConversation} />
				</div>
				<div class="navbar-end max-w-fit"></div>
			</div>
		</div>
	</div>
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<slot />
