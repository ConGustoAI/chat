<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		APIdeleteConversation,
		APIfetchConversation,
		APIfetchConversations,
		APIfetchDefaultConversation
	} from '$lib/api';
	import { ChatHistory, ChatInput, ChatMessage, ChatTitle, DrawerButton } from '$lib/components';
	import { assistants, dbUser, hiddenItems } from '$lib/stores/appstate';
	import { loginModal } from '$lib/stores/loginModal';
	import { errorToMessage, newConversation, toIdMap } from '$lib/utils';
	import { readDataStream } from 'ai';
	import { ChevronUp } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { defaultsUUID } from '$lib/db/schema';

	import dbg from 'debug';
	const debug = dbg('app:ui:chat');

	let conversations: Record<string, ConversationInterface> = {};
	let conversationOrder: string[] = [];

	let conversation: ConversationInterface | undefined;
	let updatingLike = false;
	let drawer_open = true;
	let chatLoading = false;

	let chatError: string | undefined;
	// export let data;
	// This will fetch the data eventually, but we are ok with the initial empty data.

	$: convId = $page.params.chat;

	onMount(async () => {
		debug('onMount');
		chatLoading = true;

		const [gotConvos, cgotConvo] = await Promise.all([
			APIfetchConversations().catch((e) => {
				debug('Failed to fetch conversations:', e);
				return [];
			}),
			APIfetchConversation(convId).catch((e) => {
				debug('Failed to fetch conversation:', e);
				return { userID: $dbUser?.id ?? 'none' } as ConversationInterface;
			})
		]);

		conversations = toIdMap(gotConvos);
		if (cgotConvo.id) {
			conversations[cgotConvo.id] = cgotConvo;
			conversation = conversations[cgotConvo.id];
		} else {
			conversation = newConversation($dbUser?.id ?? 'anon', $dbUser?.assistant);
		}

		conversationOrder = Object.keys(conversations);
		chatLoading = false;
		debug('onMount', { conversation, conversations, conversationOrder });
	});

	function updateConversation(convId: string) {
		debug('updateConversation', convId);
		if (convId) {
			// If the message is already loaded, use it.
			if (conversations[convId]) conversation = conversations[convId];
			// If the conversation has no messages loaded, fetch them.
			if (!conversation?.messages) {
				chatLoading = true;
				let promise;
				if (dbUser) promise = APIfetchConversation(convId);
				else promise = APIfetchDefaultConversation(convId);

				promise
					.then((data) => {
						conversations[data.id!] = { ...conversations[data.id!], ...data };
						conversation = conversations[data.id!];
					})
					.catch((e) => {
						debug('Failed to fetch conversation:', e);
						chatError = 'Failed to fetch conversation:' + errorToMessage(e);
					})
					.finally(() => {
						chatLoading = false;
					});
			}
		}
	}
	$: {
		updateConversation($page.params.chat);
	}

	async function submitConversation(toDelete?: string[]) {
		debug('submitConversation', conversation, toDelete);

		if (!dbUser) {
			debug('submitConversation', 'not logged in, redirecting to login');
			if ($loginModal) {
				($loginModal as HTMLDialogElement).showModal();
			} else {
				await goto('/login');
			}
			return;
		}

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
		debug('submitConversation POST: ', res);

		if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to submit the conversation.');
		if (!res.body) throw new Error('The response body is empty.');

		const reader = res.body.getReader();

		for await (const { type, value } of readDataStream(reader)) {
			debug('readDataStream', type, value);
			if (!conversation.messages) throw new Error('The conversation messages are missing??');
			if (type === 'text') {
				conversation.messages[conversation.messages.length - 1].text += value;
			}
			if (type === 'finish_message') {
			}
			if (type === 'data') {
				debug('readDataStream', { type, value });

				for (const dataPart of value) {
					if (typeof dataPart === 'object' && dataPart !== null) {
						if ('conversation' in dataPart) {
							const dataConversation = dataPart.conversation as unknown as ConversationInterface;
							// if (typeof dataPart.conversation !== 'string') throw new Error('The conversation ID is not a string.');
							if (conversation.id && conversation.id != dataConversation.id)
								throw new Error('The conversation ID does not match.');

							conversation = { ...conversation, ...dataConversation };
							if (!conversation.id) throw new Error('The conversation ID is missing.');

							if (!conversations[conversation.id]) {
								// New conversation is not yet in the conversations dictionary.
								conversations[conversation.id] = conversation;
								conversationOrder = [conversation.id!, ...conversationOrder];
							}
						}
						if ('userMessage' in dataPart) {
							if (!conversation.messages?.length) throw new Error('The conversation messages are missing??');
							// TS is being silly a bit
							Object.assign(
								conversation.messages[conversation.messages.length - 2],
								dataPart.userMessage as unknown as MessageInterface
							);
						}
						if ('assistantMessage' in dataPart) {
							if (!conversation.messages?.length) throw new Error('The conversation messages are missing??');
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
				debug('readDataStream error', value);
				throw new Error(value);
			}
		}
	}

	let dropdownElement: HTMLDetailsElement;

	function NewChat(assistantId?: string) {
		dropdownElement.open = false;
		conversation = newConversation($dbUser?.id ?? 'anon', assistantId);
		goto('/chat');
	}

	async function deleteConversation(conversation: ConversationInterface) {
		if (dbUser) {
			const del = await APIdeleteConversation(conversation);
			if (!del.id) throw new Error('Failed to delete the conversation.');
		}
		delete conversations[conversation.id!];
		conversationOrder = conversationOrder.filter((c) => c !== conversation.id);
	}
	let seachValue: string | undefined;
	$: filteredConversations = conversationOrder.filter(
		(c) => !seachValue || conversations[c].summary?.includes(seachValue)
	);
</script>

<main class="relative m-0 flex h-full max-h-full w-full">
	<div class="flex w-56 shrink-0 flex-col gap-2 bg-base-200 p-2" class:hidden={!drawer_open}>
		<div class="join flex w-full">
			<button class="border- btn btn-outline join-item h-full grow" on:click={() => NewChat($dbUser?.assistant)}
				>New chat</button>
			<details class="dropdown dropdown-end join-item my-0 h-full" bind:this={dropdownElement}>
				<summary class="btn btn-outline join-item mx-1 p-1"><ChevronUp class="rotate-180" /></summary>
				<ul class="menu dropdown-content z-[1] w-52 bg-base-300 p-2 shadow">
					<div class="divider w-full py-2">Your assistants</div>
					{#each Object.entries($assistants).filter(([id, ass]) => ass.userID !== defaultsUUID) as [id, assistant]}
						{#if !$hiddenItems.has(id) || $dbUser?.assistant === id}
							<button class="btn-base-300 btn btn-outline w-full" on:click={() => NewChat(assistant.id)}
								>{assistant.name}</button>
						{/if}
					{/each}
					<div class="divider w-full py-2">Default assistants</div>
					{#each Object.entries($assistants).filter(([id, ass]) => ass.userID === defaultsUUID) as [id, assistant]}
						{#if !$hiddenItems.has(id) || $dbUser?.assistant === id}
							<button class="btn-base-300 btn btn-outline w-full" on:click={() => NewChat(assistant.id)}
								>{assistant.name}</button>
						{/if}
					{/each}
				</ul>
			</details>
		</div>

		<input
			type="text"
			placeholder="Search chats..."
			class="input input-bordered min-h-12 w-full"
			bind:value={seachValue} />
		<ChatHistory {conversation} {conversations} conversationOrder={filteredConversations} {deleteConversation} />
	</div>

	<div class="divider divider-horizontal w-1" class:hidden={!drawer_open} />

	<div class="mx-0 flex h-full w-full shrink flex-col overflow-hidden bg-inherit">
		<ChatTitle {chatLoading} bind:conversation bind:updatingLike />

		<div class="mb-auto w-full grow overflow-auto bg-transparent bg-opacity-10">
			{#if conversation?.messages}
				{#each conversation.messages as m}
					<ChatMessage bind:conversation bind:message={m} {submitConversation} />
				{/each}
				<div class=" mb-20 w-full" />
			{:else}
				<div
					class="pointer-events-none m-auto flex h-full w-1/3 select-none flex-col items-center justify-center gap-6 justify-self-center font-bold grayscale"
					style="opacity:0.05">
					<img class="w-[50%]" src="/favicon.png" alt="Congusto" />
					<p class="w-fit text-nowrap text-[3vw]">Congusto Chat</p>
				</div>
			{/if}
		</div>
		<div class="divider w-full" />

		<div class="navbar m-2 h-fit shrink-0 grow-0 py-0">
			<div class="navbar-start max-w-fit">
				{#if !drawer_open}
					<div class="btn btn-circle" style="visibility: hidden;"></div>
				{/if}
			</div>
			<div class="navbar-center mx-auto h-fit max-w-[95%] grow p-0">
				<ChatInput bind:conversation {submitConversation} />
			</div>
			<div class="navbar-end max-w-fit"></div>
		</div>
	</div>
	<div class="absolute bottom-5 left-3">
		<DrawerButton bind:drawer_open />
	</div>
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify({ conversations, data }, null, 2)}</pre> -->
<slot />
