<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIdeleteConversation, APIfetchConversations, APIfetchKeys, APIfetchModels, APIfetchProviders, APIupsertConversation, APIupsertMessage } from '$lib/api';
	import { ChatHistory, ChatInput, ChatMessage, ChatTitle, SidebarButton } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import {
	apiKeys,
		assistants,
		chatDataLoading,
		chatStreaming,
		conversation,
		conversationOrder,
		conversations,
		dbUser,
		hiddenItems,
		isMobile,
		models,
		providers,
		sidebarOpen
	} from '$lib/stores/appstate';
	import { newConversation, toIdMap } from '$lib/utils';
	import { readDataStream } from 'ai';
	import { ChevronUp, Star } from 'lucide-svelte';

	import GitHub from '$lib/components/icons/GitHub.svelte';
	import dbg from 'debug';
	import { onMount } from 'svelte';
	const debug = dbg('app:ui:chat');

	// This will fetch the data eventually, but we are ok with the initial empty data.
	onMount(async () => {
		debug('dbUser changed, fetching data');
		$chatDataLoading = true;

		// Sidebar closed by default on small screens
		if (window.innerWidth < 768) {
			$sidebarOpen = false; // Open drawer on larger screens
			$isMobile = true;
		}
		const gotConvos = await APIfetchConversations().catch((e) => {
			debug('Failed to fetch conversations:', e);
			$chatDataLoading = false;
			return [];
		});

		$conversations = toIdMap(gotConvos);
		$conversationOrder = Object.keys($conversations);
		$chatDataLoading = false;
		debug('done fetching data', { $conversation, $conversations, $conversationOrder });
	});

	export let data;

	dbUser.subscribe(async () => {
		debug('dbUser changed, fetching data');

		const [fetchedProviders, fetchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		$assistants = toIdMap(data.assistants);
		$providers = toIdMap(fetchedProviders);
		$models = toIdMap(fetchedModels);
		$apiKeys = toIdMap(fetchedApiKeys);

		debug('Done fetching', {
			assistants: $assistants,
			providers: $providers,
			models: $models,
			dbUser: $dbUser,
			apiKeys: Object.keys($apiKeys)
		});
	});

	let abortController: AbortController | undefined = undefined;

	async function submitConversation(toDelete?: string[]) {
		debug('submitConversation', $conversation, toDelete);

		if (!$dbUser) {
			debug('submitConversation', 'not logged in, redirecting to login');
			await goto('/login');
		}

		$chatStreaming = true;

		try {
			if (!$conversation) throw new Error('The conversation is missing.');
			if (!$conversation.assistant) throw new Error('No assistant assigned.');
			if (!$conversation.messages) throw new Error('The conversation messages are missing.');

			if ($dbUser?.assistant === defaultsUUID && $dbUser.lastAssistant !== $conversation.assistant) {
				// The database will be updated on the back-end.
				$dbUser.lastAssistant = $conversation.assistant;
			}

			const toSend = $conversation.messages;

			if (toSend.length < 2) throw new Error('The conversation should have at least 2 messages.');
			if (toSend[toSend.length - 2].role !== 'user') throw new Error('The first message should be from the user.');
			if (toSend[toSend.length - 1].role !== 'assistant') {
				throw new Error('The last message should be from the assistant.');
			}

			abortController = new AbortController();

			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ conversation: $conversation, toDelete }),
				signal: abortController.signal
			});
			debug('submitConversation POST: ', res);

			if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to submit the conversation.');
			if (!res.body) throw new Error('The response body is empty.');

			const reader = res.body.getReader();
			let timestamp = Date.now();

			for await (const { type, value } of readDataStream(reader)) {
				debug('readDataStream', type, value);
				if (!$conversation.messages) throw new Error('The conversation messages are missing??');
				if (type === 'text') {
					$conversation.messages[$conversation.messages.length - 1].text += value;
					if (Date.now() - timestamp > 100) {
						timestamp = Date.now();
						$conversation.messages[$conversation.messages.length - 1].markdownCache = undefined;
					}
				}
				if (type === 'finish_message') {
				}
				if (type === 'data') {
					// debug('readDataStream', { type, value });

					for (const dataPart of value) {
						if (typeof dataPart === 'object' && dataPart !== null) {
							if ('conversation' in dataPart) {
								const dataConversation = dataPart.conversation as unknown as ConversationInterface;
								// if (typeof dataPart.conversation !== 'string') throw new Error('The conversation ID is not a string.');
								if ($conversation.id && $conversation.id != dataConversation.id)
									throw new Error('The conversation ID does not match.');

								$conversation = { ...$conversation, ...dataConversation };
								if (!$conversation.id) throw new Error('The conversation ID is missing.');

								if (!$conversations[$conversation.id]) {
									// New conversation is not yet in the conversations dictionary.
									$conversations[$conversation.id] = $conversation;
									$conversationOrder = [$conversation.id!, ...$conversationOrder];
								}
							}
							if ('userMessage' in dataPart) {
								if (!$conversation.messages?.length) throw new Error('The conversation messages are missing??');
								// TS is being silly a bit
								$conversation.messages[$conversation.messages.length - 2] =
									dataPart.userMessage as unknown as MessageInterface;
							}
							if ('assistantMessage' in dataPart) {
								if (!$conversation.messages?.length) throw new Error('The conversation messages are missing??');
								// TS is being silly a bit
								$conversation.messages[$conversation.messages.length - 1] =
									dataPart.assistantMessage as unknown as MessageInterface;
							}
						}
					}
				}
				if (type === 'error') {
					debug('readDataStream error', value);
					// throw new Error(value);
				}
			}
			if (!$conversation?.messages?.length) throw new Error('The conversation messages are missing??');
			$conversation.messages[$conversation.messages.length - 1].markdownCache = undefined;
		} catch (e) {
			if (e instanceof Error) {
				const E = e as Error;
				if (E.name === 'AbortError') {
					// The conversation was aborted, and thus was not saved on the server side.
					// We need to save the conversation and the messages locally and update it in the database.
					debug('submitConversation', 'aborted');
					if ($conversation && $conversation.messages && $conversation.messages?.length >= 2) {
						let newConversation = await APIupsertConversation($conversation);

						let userMessage = $conversation.messages[$conversation.messages.length - 2];

						userMessage = {
							...userMessage,
							conversationId: newConversation.id
						};

						$conversation.messages[$conversation.messages.length - 2] = await APIupsertMessage(userMessage);

						let assistantMessage = $conversation.messages[$conversation.messages.length - 1];

						assistantMessage = {
							...assistantMessage,
							finishReason: 'aborted',
							assistantID: $conversation.assistant,
							assistantName: $assistants[$conversation.assistant ?? 'unknown']?.name ?? 'Unknown',
							model: $assistants[$conversation.assistant ?? 'unknown']?.model ?? 'Unknown',
							modelName:
								$models[$assistants[$conversation.assistant ?? 'unknown']?.model ?? 'unknown']?.name ?? 'Unknown',
							temperature: $assistants[$conversation.assistant ?? 'unknown']?.temperature ?? 0,
							topP: $assistants[$conversation.assistant ?? 'unknown']?.topP ?? 0,
							topK: $assistants[$conversation.assistant ?? 'unknown']?.topK ?? 0,
							conversationId: newConversation.id
						};

						$conversation.messages[$conversation.messages.length - 1] = await APIupsertMessage(assistantMessage);

						$conversation = { ...$conversation, ...newConversation };
						if (!$conversation.id) throw new Error('The conversation ID is missing.');

						if (!$conversations[$conversation.id]) {
							$conversations[$conversation.id] = $conversation;
							$conversationOrder = [$conversation.id!, ...$conversationOrder];
						}
					}
				} else {
					throw e;
				}
			}
		} finally {
			// This will also trigger the conversation summary.
			$chatStreaming = false;
			abortController = undefined;
		}
	}

	let dropdownElement: HTMLDetailsElement;

	async function NewChat(assistantId?: string) {
		dropdownElement.open = false;
		if ($isMobile) $sidebarOpen = false;
		debug('NewChat', { assistantId, $assistants });

		$conversation = newConversation($dbUser, assistantId, $assistants);
		await goto('/chat');
	}

	async function deleteConversations(ids: string[]) {
		$conversationOrder = $conversationOrder.filter((c) => !ids.includes(c));
		if (dbUser) {
			const del = await APIdeleteConversation(ids);
			if (!del.id) throw new Error('Failed to delete the conversation.');
		}
	}
</script>

<main class="relative m-0 flex h-full max-h-full w-full flex-col md:flex-row">
	<div class="flex h-full w-full shrink-0 flex-col gap-2 bg-base-200 p-2 md:w-56 items-center justify-start" class:hidden={!$sidebarOpen}>
		<div class="join flex w-full">
			<button
				class="border- btn btn-outline join-item h-full grow"
				on:click={async () => await NewChat($dbUser?.assistant)}>New chat</button>
			<details class="dropdown dropdown-end join-item my-0 h-full" bind:this={dropdownElement}>
				<summary class="btn btn-outline join-item mx-1 p-1"><ChevronUp class="rotate-180" /></summary>
				<ul class="menu dropdown-content z-[1] w-52 bg-base-300 p-2 shadow">
					<div class="divider w-full py-2">Your assistants</div>
					{#each Object.entries($assistants).filter(([id, ass]) => ass.userID !== defaultsUUID) as [id, assistant]}
						{#if !$hiddenItems.has(id) || $dbUser?.assistant === id}
							<button class="btn-base-300 btn btn-outline w-full" on:click={async () => await NewChat(assistant.id)}
								>{assistant.name}</button>
						{/if}
					{/each}
					<div class="divider w-full py-2">Default assistants</div>
					{#each Object.entries($assistants).filter(([id, ass]) => ass.userID === defaultsUUID) as [id, assistant]}
						{#if !$hiddenItems.has(id) || $dbUser?.assistant === id}
							<button class="btn-base-300 btn btn-outline w-full" on:click={async () => await NewChat(assistant.id)}
								>{assistant.name}</button>
						{/if}
					{/each}
				</ul>
			</details>
		</div>

		<ChatHistory {deleteConversations} />
	</div>

	<div class="divider divider-horizontal hidden w-1 md:block" class:hidden={!$sidebarOpen} />

	<div class="mx-0 flex h-full w-full shrink flex-col overflow-hidden bg-inherit">
		<ChatTitle />

		<div class="mb-auto w-full grow overflow-y-auto bg-transparent bg-opacity-10">
			{#if $conversation?.messages}
				{#each $conversation.messages as m, i}
					<ChatMessage
						bind:message={m}
						loading={i === $conversation.messages.length - 1 && $chatStreaming}
						{submitConversation} />
				{/each}
				<div class="mb-20 w-full" />
			{:else if !$conversation?.id}
				<div
					class=" m-auto flex h-full w-full select-none flex-col items-center justify-center gap-6 justify-self-center lg:w-1/3">
					<div class="pointer-events-none flex flex-col font-bold grayscale" style="opacity:0.05">
						<img class="w-[50%] max-w-[200px] self-center" src="/favicon.png" alt="Congusto" />
						<p class="w-fit text-nowrap text-[5vw] md:text-[3vw]">Congusto Chat</p>
					</div>
					<a href="https://congusto.ai" class="flex text-2xl opacity-50" target="_blank" rel="noopener noreferrer">
						<p class="mx-2 opacity-50">Made with ❤️ by</p>
						<span class="link opacity-100">Congusto.ai</span>
					</a>
					<a
						href="https://github.com/congustoAI/chat"
						class="items-top flex text-2xl opacity-50"
						target="_blank"
						rel="noopener noreferrer">
						<p class=" mx-2 flex items-center opacity-50">
							Give us a <Star class="mx-1" color="yellow" fill="yellow" /> on
						</p>
						<span class="link flex items-center opacity-100">
							<GitHub />
							GitHub
						</span>
					</a>
					{#if !$dbUser}
						<a href="/login" class="btn btn-outline mt-16 text-xl">
							<p class="mx-2">Login to start chatting</p>
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<div class="divider w-full" />

		<div class="navbar m-2 h-fit shrink-0 grow-0 py-0">
			<div class="navbar-start max-w-fit">
				{#if !$sidebarOpen}
					<div class="btn btn-circle md:hidden" style="visibility: hidden;"></div>
				{/if}
			</div>
			<div class="navbar-center mx-auto h-fit max-w-full grow p-0 md:max-w-[95%]">
				<ChatInput {submitConversation} cancelConversation={() => abortController?.abort()} />
			</div>
			<div class="navbar-end max-w-fit"></div>
		</div>
	</div>
	<div class="absolute bottom-4 left-2 z-20">
		<SidebarButton />
	</div>
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify({ conversations, data }, null, 2)}</pre> -->
<slot />
