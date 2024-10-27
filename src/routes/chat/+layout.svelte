<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIdeleteConversations, APIfetchConversations } from '$lib/api';
	import { A } from '$lib/appstate.svelte.js';
	import { ChatHistory, ChatInput, ChatMessage, ChatTitle, SidebarButton } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { abortController, submitConversationClientSide } from '$lib/utils/chat.svelte.js';
	import { addMessage, assert, newConversation } from '$lib/utils/utils.js';
	import { ChevronUp, Plus, Star } from 'lucide-svelte';

	import GitHub from '$lib/components/icons/GitHub.svelte';
	import dbg from 'debug';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import MediaEditor from '$lib/components/media/MediaEditor.svelte';
	const debug = dbg('app:ui:chat');

	// This will fetch the data eventually, but we are ok with the initial empty data.
	onMount(async () => {
		debug('Mounted, fetching data');

		// Sidebar closed by default on small screens
		if (window.innerWidth < 640) {
			A.sidebarOpen = false; // Open drawer on larger screens
			A.isMobile = true;
		}
		A.chatDataLoading = true;

		const gotConvos = await APIfetchConversations().catch((e) => {
			debug('Failed to fetch conversations:', e);
			A.chatDataLoading = false;
			return [];
		});

		for (const c of gotConvos) {
			assert(c.id);
			if (A.conversations[c.id]) Object.assign(A.conversations[c.id], c);
			else A.conversations[c.id] = c;
		}

		A.conversationOrder = Object.entries(A.conversations)
			.sort((a, b) => {
				return (b[1]?.order ?? 0) - (a[1]?.order ?? 0);
			})
			.map(([id]) => id);

		A.chatDataLoading = false;
		debug(
			'done fetching data',
			$state.snapshot({
				conversations: A.conversations,
				conversationOrder: A.conversationOrder
			})
		);
	});

	let { data, children } = $props();

	$inspect(A.dbUser).with((type, value) => {
		debug('dbUser: %s %o', type, value);
	});

	// $effect(() => {
	// 	debug('A.conversation: ', $state.snapshot(A.conversation));
	// });

	let assistantSelectDropdown: HTMLDetailsElement | null = $state(null);

	async function NewChat(assistantId?: string) {
		if (assistantSelectDropdown) assistantSelectDropdown.open = false;
		if (A.isMobile) A.sidebarOpen = false;
		// debug('NewChat', { assistantId, assistants: A.assistants });

		if (!assistantId && A.conversation?.id) {
			debug('No assistant ID provided, using default');
			assistantId = A.conversation?.assistant
		}

		A.conversation = newConversation(A.dbUser, assistantId, A.assistants);
		await goto('/chat');
	}

	async function deleteConversations(ids: string[]) {
		A.conversationOrder = A.conversationOrder.filter((c) => !ids.includes(c));
		if (A.dbUser) {
			const delIds = await APIdeleteConversations(ids);
			if (delIds?.length !== ids.length) {
				debug('Not all conversations have been deleted:');
				debug('Rquestd: ', ids);
				debug('Confirmed: ', delIds);
			}
		}
	}
</script>


<svelte:head>
	<title>{A.conversation?.summary ?? "Congusto Chat"}</title>
</svelte:head>

<main class="relative m-0 flex h-full max-h-full w-full flex-col sm:flex-row">
	{#if A.sidebarOpen}
		<div
			class="flex h-full w-full shrink-0 flex-col items-center justify-start gap-2 bg-base-200 p-2 sm:w-56"
			transition:slide={{ duration: 100, axis: 'x' }}>
			<div class="join flex w-full">
				<button
					class="btn btn-outline join-item btn-sm h-full grow"
					onclick={async () => await NewChat()}>New chat</button>
				<details class="dropdown dropdown-end join-item my-0 h-full" bind:this={assistantSelectDropdown}>
					<summary class="btn btn-outline join-item btn-sm h-full px-1"><ChevronUp class="rotate-180" /></summary>
					<ul class="menu dropdown-content z-[20] w-52 bg-base-300 p-2 shadow">
						<div class="divider w-full py-2">Your assistants</div>
						{#each Object.entries(A.assistants).filter(([id, ass]) => ass.userID !== defaultsUUID) as [id, assistant]}
							{#if !A.hiddenItems.has(id) || A.dbUser?.assistant === id}
								<button class="btn-base-300 btn btn-outline w-full" onclick={async () => await NewChat(assistant.id)}
									>{assistant.name}</button>
							{/if}
						{/each}
						<div class="divider w-full py-2">Default assistants</div>
						{#each Object.entries(A.assistants).filter(([id, ass]) => ass.userID === defaultsUUID) as [id, assistant]}
							{#if !A.hiddenItems.has(id) || A.dbUser?.assistant === id}
								<button class="btn-base-300 btn btn-outline w-full" onclick={async () => await NewChat(assistant.id)}
									>{assistant.name}</button>
							{/if}
						{/each}
					</ul>
				</details>
			</div>

			<ChatHistory {deleteConversations} />
		</div>
	{/if}

	<div class="divider divider-horizontal hidden w-1 sm:block" class:hidden={!A.sidebarOpen}></div>

	<div class="mx-0 flex h-full w-full shrink flex-col overflow-hidden bg-inherit">
		<ChatTitle />
		<div class="mb-auto flex w-full grow flex-col justify-start overflow-y-auto bg-transparent bg-opacity-10">
			{#if A.conversation?.messages}
				{#each A.conversation.messages as m, i}
					<ChatMessage
						bind:message={A.conversation.messages[i]}
						loading={i === A.conversation.messages.length - 1 && A.chatStreaming}
						submitConversation={submitConversationClientSide} />
				{/each}
			{/if}

			{#if !A.conversation?.messages?.length}
				<div class="dropdown dropdown-end m-2 self-end">
					<button class="btn btn-ghost btn-outline btn-sm rounded-md p-1" title="Add messages">
						<Plus size="fit-h" />
					</button>
					<ul class="menu dropdown-content z-20 w-32 text-nowrap bg-base-200 p-2">
						<li>
							<button
								class="btn btn-ghost btn-sm justify-end"
								onclick={async (e) => {
									const target = e.target as HTMLButtonElement;
									target.blur();
									await addMessage({ role: 'assistant', above: false, editing: true });
								}}>assistant</button>
						</li>
						<li>
							<button
								class="btn btn-ghost btn-sm justify-end"
								onclick={async (e) => {
									const target = e.target as HTMLButtonElement;
									target.blur();
									await addMessage({ role: 'user', above: false, editing: true });
								}}>user</button>
						</li>
					</ul>
				</div>
			{/if}

			{#if A.conversation?.messages}
				<div class="mb-20 w-full"></div>
			{/if}
			{#if !A.conversation?.messages && !A.conversation?.id}
				<div
					class="m-auto flex w-full grow select-none flex-col items-center justify-center gap-6 justify-self-center lg:w-1/3">
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
					{#if !A.dbUser}
						<a href="/login" class="btn btn-outline mt-16 text-xl">
							<p class="mx-2">Login to start chatting</p>
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<div class="divider w-full"></div>

		<div class="navbar m-2 h-fit shrink-0 grow-0 py-0">
			<div class="navbar-start max-w-fit">
				{#if !A.sidebarOpen}
					<div class="btn btn-circle sm:hidden" style="visibility: hidden;"></div>
				{/if}
			</div>
			<div class="navbar-center mx-auto h-fit max-w-full grow p-0 md:max-w-[95%]">
				<ChatInput
					submitConversation={submitConversationClientSide}
					cancelConversation={() => abortController?.abort()} />
			</div>
			<div class="navbar-end max-w-fit"></div>
		</div>
	</div>
	<div class="absolute bottom-4 left-2 z-20">
		<SidebarButton />
	</div>
	<MediaEditor />
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify({ conversations, data }, null, 2)}</pre> -->
{@render children()}
