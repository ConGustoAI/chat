<script lang="ts">
	import { Star } from 'lucide-svelte';

	export let conversations: Record<string, ConversationInterface>;
	export let conversation: ConversationInterface | undefined;
	export let conversationOrder: string[];
</script>

<ul class="menu max-w-full p-0">
	{#each conversationOrder as c}
		<li class="max-w-fuill shrink p-0" class:bg-primary-content={conversation?.id == c}>
			<a href={'/chat/' + c} class="max-w-full">
				<span>
					{#if conversations[c].like}
						<Star color="yellow" fill="yellow" />
					{/if}
				</span>
				<span class="max-w-full shrink truncate">{conversations[c].summary ?? 'New Chat'}</span></a>
		</li>
	{/each}
</ul>
