<script lang="ts">
	import { Star } from 'lucide-svelte';
	import DeleteButton from './DeleteButton.svelte';

	export let conversations: Record<string, ConversationInterface>;
	export let conversation: ConversationInterface | undefined;
	export let conversationOrder: string[];
	export let deleteConversation;
</script>

<ul class="base-200 no-scrollbar menu max-w-full flex-nowrap overflow-y-auto p-0">
	{#each conversationOrder as c}
		<li class="tooltip relative p-0 min-h-8" title={conversation?.summary} class:bg-base-300={conversation?.id == c}>
			<!-- <span class="max-w-fit">{conversations[c].order}</span> -->
			<a href={'/chat/' + c} class="relative pr-6">
				{#if conversations[c].like}
					<span class="">
						<Star size={15} color="var(--star)" fill="var(--star)" />
					</span>
				{/if}
				<span class="truncate">{(conversations[c].summary ?? 'New Chat').trim()}</span>
			</a>

			<DeleteButton
				class="dropdown-left absolute right-0 top-0.5 m-0 p-0"
				btnClass="btn btn-ghost btn-sm m-0 rounded-md p-0 px-1"
				deleteAction={async () => {
					await deleteConversation(conversations[c]);
				}}
				size={19} />
		</li>
	{/each}
</ul>
