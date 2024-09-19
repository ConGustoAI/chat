<script lang="ts">
	import { conversation } from '$lib/stores/appstate';
	import { Link } from 'lucide-svelte';

	export let updateConversation: (e: Event) => Promise<void>;
	let updatingPublic: boolean = false;
</script>

{#if $conversation?.id}
	<div class="hidden items-center justify-end gap-2 md:flex">
		{#if $conversation.public}
			<a href={'/public/' + $conversation.id} class="btn btn-sm rounded-md bg-base-300"><Link size={18} /></a>
		{/if}
		<label for="public" class="text-sm">Share</label>
		{#if updatingPublic}
			<span class="loadin loading loading-spinner"></span>
		{:else}
			<input
				id="public"
				type="checkbox"
				class="checkbox"
				bind:checked={$conversation.public}
				on:change={async (e) => {
					updatingPublic = true;
					await updateConversation(e);
					updatingPublic = false;
					if ($conversation.public) {
						const url = `${window.location.origin}/public/${$conversation.id}`;
						navigator.clipboard.writeText(url);
					}
				}} />
		{/if}
	</div>
{/if}
