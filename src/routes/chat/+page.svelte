<script lang="ts">
	import { page } from '$app/stores';
	import { assistants, conversation, dbUser } from '$lib/stores/appstate';
	import { newConversation } from '$lib/utils';
	import dbg from 'debug';
	const debug = dbg('app:ui:routes:chat:new');

	function fetchConversation(convId: string) {
		if (convId) {
			debug('Expected a new conversation, but got an existing one:', convId);
			return;
		}
		$conversation = newConversation($dbUser, $assistants);
	}

	$: fetchConversation($page.params.chat);
</script>
