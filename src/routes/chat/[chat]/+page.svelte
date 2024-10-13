<script lang="ts">
	import { page } from '$app/stores';
	import { APIfetchConversation } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { syncMediaFileURLs } from '$lib/utils/media_utils.svelte';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { untrack } from 'svelte';
	const debug = dbg('app:ui:routes:chat:[id]');

	function fetchConversation(convID: string) {
		assert(convID);

		// If the message is already loaded, use it.
		if (A.conversations[convID] && A.conversation?.id !== A.conversations[convID].id)
			A.conversation = A.conversations[convID];
		// If the conversation has no messages loaded, fetch them.
		if (!A.conversation?.messages && !A.chatDataLoading) {
			A.chatDataLoading = true;
			let promise;
			promise = APIfetchConversation(convID, true);

			promise
				.then((data) => {
					A.conversations[data.id!] = { ...A.conversations[data.id!], ...data };
					A.conversation = A.conversations[data.id!];
					(A.conversation.media ?? []).map(syncMediaFileURLs);
				})
				.catch((e) => {
					debug('Failed to fetch conversation:', e.message);
				})
				.finally(() => {
					A.chatDataLoading = false;
				});
		}
	}

	$effect(() => {
		// This gets called once on mount, so we add the check to avid a double fetch.
		if ($page.params.chat && untrack(() => A.conversation?.id !== $page.params.chat)) {
			untrack(() => fetchConversation($page.params.chat));
		}
	});

	// $effect(() => {
	// 	debug('A.conversation changed: ', A.conversation);
	// })

</script>
