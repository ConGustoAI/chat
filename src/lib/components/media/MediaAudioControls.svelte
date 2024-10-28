<script lang="ts">
	import { APIupsertMedia } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { PDFToImages } from '$lib/utils/pdf.svelte';
	import { assert, isPublicPage, secondstoMMSS } from '$lib/utils/utils';
	import dbg from 'debug';
	import { untrack } from 'svelte';
	import InfoPopup from '../InfoPopup.svelte';
	import { addImageToSkip, removeImageFromSkip } from '$lib/utils/media_utils.svelte';
	const debug = dbg('app:ui:components:MediaAudioControls');

	let currentAssistant: AssistantInterface | undefined = $derived.by(() => {
		return A.assistants[A.conversation?.assistant ?? 'none'];
	});
</script>

{#if A.mediaEditing}
	<div class="mb-auto flex w-full flex-col items-start gap-1 px-4">
		<p>{A.mediaEditing.filename}</p>
		<p>Duration: {secondstoMMSS(A.mediaEditing.originalDuration ?? 0)}</p>
	</div>
{/if}
