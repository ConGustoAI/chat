<script lang="ts">
	import { newConversation } from '$lib/utils';
	import { APIfetchConversation } from '$lib/api';
	import { dbUser, assistants, conversations, conversation, chatDataLoading } from '$lib/stores/appstate';
	import { page } from '$app/stores';
	import dbg from 'debug';
	const debug = dbg('app:ui:routes:chat:[id]');

	function fetchConversation(convId: string) {
		if (!convId) {
			debug('No conversation ID provided');
			return;
		}

		// If the message is already loaded, use it.
		if ($conversations[convId]) $conversation = $conversations[convId];
		// If the conversation has no messages loaded, fetch them.
		if (!$conversation?.messages) {
			$chatDataLoading = true;
			let promise;
			promise = APIfetchConversation(convId);

			promise
				.then((data) => {
					$conversations[data.id!] = { ...$conversations[data.id!], ...data };
					$conversation = $conversations[data.id!];
				})
				.catch((e) => {
					debug('Failed to fetch conversation:', e);
				})
				.finally(() => {
					$chatDataLoading = false;
				});
		}
	}

    $: fetchConversation($page.params.chat);

	// } else {
	//     $conversation = newConversation($dbUser, $assistants);
	// }
</script>
