<script lang="ts">
	import { conversation, conversations, sidebarOpen, isMobile } from '$lib/stores/appstate';
	import { Star, Link } from 'lucide-svelte';

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

<div class="divider w-full grow-0">{title}</div>
{#each group as c}
	<li
		class="tooltip relative min-h-8 w-full grow-0 p-0"
		title={$conversations[c]?.summary}
		class:bg-base-300={$conversation?.id === c}>
		<input
			type="checkbox"
			class="checkbox absolute left-1 top-1/2 z-10 m-0 -translate-y-1/2 transform p-0"
			checked={selectedConversations.includes(c)}
			on:change={(e) => handleCheckboxChange(e, c)} />

		<a
			href={'/chat/' + c}
			class="w-full pl-9"
			on:click={() => {
				if ($isMobile) $sidebarOpen = false;
			}}>
			{#if $conversations[c]?.like}
				<span>
					<Star size={15} color="var(--star)" fill="var(--star)" />
				</span>
			{/if}

			{#if $conversations[c]?.public}
				<span><Link size={15} /></span>
			{/if}

			<span class="text-nowrap">{($conversations[c]?.summary ?? 'New Chat').trim()}</span>
		</a>
	</li>
{/each}
