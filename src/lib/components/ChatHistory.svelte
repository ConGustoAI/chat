<script lang="ts">
	import { Star } from 'lucide-svelte';

	export let conversations: Record<string, ConversationInterface>;
	export let id: string;
</script>

<div class="p-4">
	<input type="text" placeholder="Search chats..." class="input input-bordered w-full" />
</div>
<ul class="menu max-w-full">
	{#each Object.entries(conversations) as [k, c]}
		<!-- Skip the null (new) conversation -->
		{#if k}
			<li class="max-w-fuill shrink" class:bg-primary-content={id == k}>
				<a href={k != 'new' ? '/chat/' + k : '/chat'} class="max-w-full">
					<span>
						{#if c.like}
							<Star color="yellow" fill="yellow" />
						{/if}
					</span>
					<span class="max-w-full shrink truncate">{c.summary ?? 'New Chat'}</span></a>
			</li>
		{/if}
	{/each}
</ul>
