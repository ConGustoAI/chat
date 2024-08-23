<script lang="ts">
	import { page } from '$app/stores';
	import { APIfetchPublicConversation } from '$lib/api';
	import { ChatMessage, ChatTitle } from '$lib/components';
	import { onMount } from 'svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:public');

	let conversation: ConversationInterface | undefined;
	let drawer_open = true;
	let chatLoading = false;

	let chatError: string | undefined;

	$: convId = $page.params.chat;

	onMount(async () => {
		debug('onMount');
		chatLoading = true;
		conversation = await APIfetchPublicConversation(convId).catch((e) => {
			debug('Failed to fetch conversation:', e);
			chatLoading = false;
			return undefined;
		});

		chatLoading = false;
		debug('onMount', { conversation });
	});
</script>

<main class="relative m-0 flex h-full max-h-full w-full">
	<div class="mx-0 flex h-full w-full shrink flex-col overflow-hidden bg-inherit">
		<ChatTitle {chatLoading} bind:conversation isPublic={true} updatingLike={false} />

		<div class="mb-auto w-full grow overflow-auto bg-transparent bg-opacity-10">
			{#if conversation?.messages}
				{#each conversation.messages as m}
					<ChatMessage bind:conversation bind:message={m} isPublic={true} submitConversation={async () => {}} />
				{/each}
				<div class=" mb-20 w-full" />
			{:else}
				<div class="flex h-full flex-col items-center">
					{#if !conversation && !chatLoading}
						<p class="w-fit text-nowrap text-[2vw]">Conversation does not exist or is not public</p>
						<a
							href="/chat"
							class="m-auto flex h-full select-none w-1/3 flex-col items-center justify-center gap-6 justify-self-center font-bold"
							style="opacity:0.1">
							<img class="w-[50%]" src="/favicon.png" alt="Congusto" />
							<p class="w-fit text-nowrap text-[3vw]">Congusto Chat</p>
						</a>
					{:else}
						<div
							class="pointer-events-none m-auto flex h-full w-1/3 select-none flex-col items-center justify-center gap-6 justify-self-center font-bold grayscale"
							style="opacity:0.05">
							<img class="w-[50%]" src="/favicon.png" alt="Congusto" />
							<p class="w-fit text-nowrap text-[3vw]">Congusto Chat</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
		<div class="divider w-full" />
	</div>
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify({ conversations, data }, null, 2)}</pre> -->
<slot />
