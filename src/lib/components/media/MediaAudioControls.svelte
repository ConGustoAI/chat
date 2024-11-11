<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { secondstoMMSS } from '$lib/utils/utils';
	import dbg from 'debug';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const debug = dbg('app:ui:components:MediaAudioControls');

	// let currentAssistant: AssistantInterface | undefined = $derived.by(() => {
	// 	return A.assistants[A.conversation?.assistantID ?? 'none'];
	// });
</script>

{#if A.mediaEditing}
	<div class="mb-auto flex w-full flex-col items-start gap-1 px-4">
		<p>{A.mediaEditing.filename}</p>
		<p>Duration: {secondstoMMSS(A.mediaEditing.originalDuration ?? 0)}</p>
	</div>
{/if}
