<script lang="ts">
	import { page } from '$app/stores';
	import { APIfetchConversation } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { syncMedia } from '$lib/utils/media_utils.svelte';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { untrack } from 'svelte';
	const debug = dbg('app:ui:routes:chat:[id]');

	async function fetchConversation(convID: string): Promise<void> {
		assert(convID);

		// If the message is already loaded, use it.
		if (A.conversations[convID] && A.conversation?.id !== A.conversations[convID].id)
			A.conversation = A.conversations[convID];
		// If the conversation has no messages loaded, fetch them.
		if (!A.conversation?.messages && !A.chatDataLoading) {
			A.chatDataLoading = true;

			try {
				const fc = await APIfetchConversation(convID);
				assert(fc.id);

				A.conversations[fc.id] = { ...A.conversations[fc.id!], ...fc };
				A.conversation = A.conversations[fc.id!];
				if (!A.conversation.media) A.conversation.media = [];

				// Note: We don't await the promises here, but instread we await the values as we need them in the ui.
				for (const m of A.conversation.media) {
					syncMedia(m);
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
	}

	$effect(() => {
		// This gets called once on mount, so we add the check to avid a double fetch.
		if ($page.params.chat && untrack(() => A.conversation?.id !== $page.params.chat)) {
			untrack(() => fetchConversation($page.params.chat));
		}
	});
</script>
