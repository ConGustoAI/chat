<script lang="ts">
	import { conversation, conversations, sidebarOpen, isMobile } from '$lib/stores/appstate';
	import { Star } from 'lucide-svelte';

	export let title: string;
	export let group: string[];
	export let selectedConversations: string[]; // This will be bound directly

	function handleCheckboxChange(event: Event, conversationId: string) {
		const target = event.target as HTMLInputElement;
		if (target.checked) {
			// Add conversation ID if not already selected
			if (!selectedConversations.includes(conversationId)) {
				selectedConversations = [...selectedConversations, conversationId];
			}
		} else {
			// Remove conversation ID if unchecked
			selectedConversations = selectedConversations.filter((id) => id !== conversationId);
		}
	}
</script>

<div class="divider w-full">{title}</div>
{#each group as c}
	<li
		class="tooltip relative min-h-8 p-0"
		title={$conversations[c]?.summary}
		class:bg-base-300={$conversation?.id === c}>
		<input
			type="checkbox"
			class="checkbox absolute left-1 top-1/2 z-10 m-0 -translate-y-1/2 transform p-0"
			checked={selectedConversations.includes(c)}
			on:change={(e) => handleCheckboxChange(e, c)} />

		<a
			href={'/chat/' + c}
			class="relative pl-8"
			on:click={() => {
				if ($isMobile) $sidebarOpen = false;
			}}>
			{#if $conversations[c]?.like}
				<span class="">
					<Star size={15} color="var(--star)" fill="var(--star)" />
				</span>
			{/if}
			<span class="truncate">{($conversations[c]?.summary ?? 'New Chat').trim()}</span>
		</a>
	</li>
{/each}
