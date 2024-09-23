<script lang="ts">
	import { page } from '$app/stores';
	import { MetaTag } from '$lib/components';
	import { assistants, conversation, dbUser } from '$lib/stores/appstate';
	import { newConversation } from '$lib/utils';
	import dbg from 'debug';
	const debug = dbg('app:ui:routes:chat:new');

	function fetchConversation(convId: string) {
		if (convId) {
			debug('Expected a new conversation, but got an existing one:', convId);
			return;
		}
		// If the previous conversation was a new conversation, keep the assistant ID.
		const oldAssistantId = $conversation?.id ? undefined : $conversation?.assistant;
		$conversation = newConversation($dbUser, oldAssistantId, $assistants);
	}

	$: fetchConversation($page.params.chat);
</script>

<MetaTag title="Congusto Chat" url={$page.url.href}/>