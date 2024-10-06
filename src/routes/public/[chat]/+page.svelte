<script lang="ts">
	import { page } from '$app/stores';
	import { APIfetchPublicConversation } from '$lib/api';
	import { ChatMessage, ChatTitle, MetaTag } from '$lib/components';
	import { onMount } from 'svelte';

	import dbg from 'debug';
	import { conversation } from '$lib/stores/appstate.js';
	// import { chatDataLoading, conversation } from '$lib/stores/appstate';
	const debug = dbg('app:ui:public');

	export let data;

	$: $conversation = data.conversation;

	// onMount(async () => {
	// 	debug('onMount');
	// 	$chatDataLoading = true;
	// 	$conversation = await APIfetchPublicConversation($page.params.chat).catch((e) => {
	// 		debug('Failed to fetch conversation:', e);
	// 		$chatDataLoading = false;
	// 		return undefined;
	// 	});

	// 	$chatDataLoading = false;
	// 	debug('onMount', { conversation });
	// });

	$: title = data.conversation ? data.conversation.summary || 'New Chat' : 'Not found';

	function makeDescription(conversation: ConversationInterface | undefined) {
		if (!conversation?.messages?.length) return '';

		const text = conversation?.messages?.length === 1 ? conversation.messages[0].text : conversation.messages[1].text;
		return (text.length > 80 ? text.slice(0, 77) + '...' : text).split('\n')[0];
	}

	$: description = makeDescription(data.conversation);

	debug('page', $page);
</script>

<MetaTag {title} url={$page.url.href} {description} image_url={$page.url.origin + '/favicon.png'} />

<main class="relative m-0 flex h-full max-h-full w-full">
	<div class="mx-0 flex h-full w-full shrink flex-col overflow-hidden bg-inherit">
		<ChatTitle isPublic={true} />

		<div class="mb-auto w-full grow overflow-auto bg-transparent bg-opacity-10">
			{#if data.conversation?.messages}
				{#each data.conversation.messages as m}
					<ChatMessage bind:message={m} isPublic={true} submitConversation={async () => {}} />
				{/each}
				<div class=" mb-20 w-full"></div>
			{:else}
				<div class="flex h-full flex-col items-center">
					{#if !data.conversation}
						<p class="w-fit text-nowrap text-[2vw]">Conversation does not exist or is not public</p>
						<a
							href="/chat"
							class="m-auto flex h-full w-1/3 select-none flex-col items-center justify-center gap-6 justify-self-center font-bold"
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
		<div class="divider w-full"></div>
	</div>
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify({ conversations, data }, null, 2)}</pre> -->
<slot />
