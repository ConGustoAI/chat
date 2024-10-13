<script lang="ts">
	import { page } from '$app/stores';
	import { MetaTag } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { newConversation } from '$lib/utils/utils';
	import dbg from 'debug';
	import { onMount } from 'svelte';
	const debug = dbg('app:ui:routes:chat:new');

	let { data } = $props();

	function fetchConversation(convId: string) {
		if (convId) {
			debug('Expected a new conversation, but got an existing one:', convId);
			return;
		}
		// If the previous conversation was a new conversation, keep the assistant ID.
		const oldAssistantId = A.conversation?.id ? undefined : A.conversation?.assistant;
		A.conversation = newConversation(data.dbUser, oldAssistantId, A.assistants);
	}

	onMount(() => {
		fetchConversation($page.params.chat);
	});
</script>

<MetaTag title="Congusto Chat" url={$page.url.href} />
