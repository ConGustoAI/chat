<script lang="ts">
	import { page } from '$app/stores';
	import { A } from '$lib/appstate.svelte';
	import { newConversation } from '$lib/utils/utils';
	import dbg from 'debug';
	import { onMount, untrack } from 'svelte';
	const debug = dbg('app:ui:routes:chat:new');

	let { data } = $props();

	function fetchConversation() {
		// If the previous conversation was a new conversation, keep the assistant ID.
		// const oldAssistantId = A.conversation?.id ? A.conversation?.assistant : undefined;
		const oldAssistantId = A.conversation?.assistantID;
		A.conversation = newConversation(data.session?.user, oldAssistantId, A.assistants);
		debug('New conversation:', oldAssistantId, $state.snapshot(A.conversation));
	}

	onMount(() => {
		if (!$page.params.chat) {
			untrack(() => fetchConversation());
		}
	});
</script>
