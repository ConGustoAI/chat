<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { APIfetchConversation, APIfetchPublicConversation } from '$lib/api';
	import { ChatMessage, ChatTitle, MetaTag } from '$lib/components';
	import { onMount, untrack } from 'svelte';

	import dbg from 'debug';
	import { A } from '$lib/appstate.svelte';
	import MediaEditor from '$lib/components/media/MediaEditor.svelte';
	import { assert } from '$lib/utils/utils';
	import { mediaCreateThumbnail, mediaProcessResize, syncMedia } from '$lib/utils/media_utils.svelte';
	const debug = dbg('app:ui:public');

	async function fetchConversation(convID: string): Promise<void> {
		assert(convID);

		A.chatDataLoading = true;

		try {
			A.conversation = await APIfetchPublicConversation(convID);

			if (!A.conversation.media) A.conversation.media = [];

			for (const m of A.conversation.media) {
				// Don't await.
				syncMedia(m).then(async () => Promise.all([mediaProcessResize(m), mediaCreateThumbnail(m)]));
			}

			A.conversation.messages?.map((m) => {
				m.markdownCache = undefined;
				if (m.mediaIDs?.length) {
					m.media = [];
					for (const mediaID of m.mediaIDs) {
						const media = A.conversation?.media?.find((m) => m.id === mediaID);
						if (media) {
							m.media.push(media);
						}
					}
				}
			});
		} catch (e) {
			debug('error fetching conversation', e);
		} finally {
			A.chatDataLoading = false;
			debug('done fetching conversation', $state.snapshot(A.conversation));
		}
	}

	$effect(() => {
		// This gets called once on mount, so we add the check to avid a double fetch.
		if ($page.params.chat && untrack(() => A.conversation?.id !== $page.params.chat)) {
			untrack(() => (fetchConversation($page.params.chat)));
		}
	});

	// debug('page', $page);
</script>

<main class="relative m-0 flex h-full max-h-full w-full">
	<div class="mx-0 flex h-full w-full shrink flex-col overflow-hidden bg-inherit">
		<ChatTitle isPublic={true} />
		{#if !A.chatDataLoading}
			<div class="g-transparent mb-auto w-full grow overflow-auto bg-opacity-10">
				{#if A.conversation?.messages}
					{#each A.conversation.messages as m, i}
						<ChatMessage message={A.conversation.messages[i]} isPublic={true} submitConversation={async () => {}} />
					{/each}
					<div class=" mb-20 w-full"></div>
				{:else}
					<div class="flex h-full flex-col items-center">
						{#if !A.conversation}
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
		{/if}
	</div>
	<MediaEditor />
</main>

<!-- <pre>{JSON.stringify({ chat: $page.params.chat, conversation, conversations, assistants }, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify({ conversations, data }, null, 2)}</pre> -->
