<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { Link } from 'lucide-svelte';

	let { updateConversation }: { updateConversation: (e: Event) => Promise<void> } = $props();
	let updatingPublic = $state(false);
</script>

{#if A.conversation?.id}
	<div class="hidden items-center justify-end gap-2 md:flex">
		{#if A.conversation.public}
			<a href={'/public/' + A.conversation.id} class="btn btn-sm rounded-md bg-base-300"><Link size={18} /></a>
		{/if}
		<label for="public" class="text-sm">Share</label>
		{#if updatingPublic}
			<span class="loadin loading loading-spinner"></span>
		{:else}
			<input
				id="public"
				type="checkbox"
				class="checkbox"
				bind:checked={A.conversation.public}
				onchange={async (e) => {
					updatingPublic = true;
					await updateConversation(e);
					updatingPublic = false;
					if (A.conversation?.public) {
						const url = `${window.location.origin}/public/${A.conversation.id}`;
						navigator.clipboard.writeText(url);
					}
				}} />
		{/if}
	</div>
{/if}
