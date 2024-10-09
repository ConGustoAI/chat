<script lang="ts">
	import { page } from '$app/stores';
	import { APIfetchConversation } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	const debug = dbg('app:ui:routes:chat:[id]');

	function fetchConversation(convId: string) {
		if (!convId) {
			debug('No conversation ID provided');
			return;
		}

		// If the message is already loaded, use it.
		if (A.conversations[convId]) A.conversation = A.conversations[convId];
		// If the conversation has no messages loaded, fetch them.
		if (!A.conversation?.messages && !A.chatDataLoading) {
			A.chatDataLoading = true;
			let promise;
			promise = APIfetchConversation(convId);

			promise
				.then((data) => {
					A.conversations[data.id!] = { ...A.conversations[data.id!], ...data };
					A.conversation = A.conversations[data.id!];
				})
				.catch((e) => {
					debug('Failed to fetch conversation:', e);
				})
				.finally(() => {
					A.chatDataLoading = false;
				});
		}
	}

	$effect(() => {
		// This gets called once on mount, so we add the check to avid a double fetch.
		if (A.conversation?.id !== $page.params.chat) {
			fetchConversation($page.params.chat);
		}
	});
</script>
