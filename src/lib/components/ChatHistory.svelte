<script lang="ts">
	import { DeleteButton } from '$lib/components';
	import { conversation, conversationOrder, conversations, isMobile, sidebarOpen } from '$lib/stores/appstate';
	import { Star } from 'lucide-svelte';

	// export let conversationOrder: string[];
	export let deleteConversations: (id: string[]) => Promise<void>;

	let seachValue: string | undefined;
	$: filteredConversations = $conversationOrder.filter(
		(c) => !seachValue || $conversations[c].summary?.toLowerCase().includes(seachValue.toLowerCase())
	);

	let selectedConversations: string[] = [];
	let deleting = false;

	export function selectAll(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.checked) {
			selectedConversations = filteredConversations;
		} else {
			selectedConversations = [];
		}
	}

	export async function deleteSelected() {
		deleting = true;
		try {
			await deleteConversations(selectedConversations);
		} finally {
			deleting = false;
		}
		selectedConversations = [];
		seachValue = '';
		deleting = false;
	}
</script>

<div class="relative w-full">
	<input
		type="checkbox"
		class="checkbox absolute left-3 top-1/2 z-10 -translate-y-1/2 transform"
		on:change={(e) => selectAll(e)}
		checked={!!selectedConversations.length && selectedConversations.length === filteredConversations.length} />
	{#if selectedConversations.length}
		{#if deleting}
			<span class="loading loading-spinner absolute right-3 top-1/2 -translate-y-1/2 transform" />
		{:else}
			<DeleteButton
				class="dropdown-right absolute right-3 top-1/2 -translate-y-1/2 z-10"
				btnClass="btn btn-sm m-0 btn-outline rounded-md p-0 px-1"
				deleteAction={deleteSelected}
				size={19} />
		{/if}
	{/if}

	<input
		type="text"
		placeholder="Search chats..."
		class="input input-bordered min-h-12 w-full pl-12"
		bind:value={seachValue} />
</div>

<ul class="base-200 no-scrollbar menu max-h-full max-w-full flex-nowrap overflow-y-auto p-0">
	{#if selectedConversations.length}
		<div class="z-20 flex justify-start px-0"></div>
		<div class="divider min-h-4 w-full"></div>
	{/if}

	{#each filteredConversations as c}
		<li class="tooltip relative min-h-8 p-0" title={$conversation?.summary} class:bg-base-300={$conversation?.id == c}>
			<!-- <span class="max-w-fit">{conversations[c].order}</span> -->
			<input
				type="checkbox"
				class="checkbox absolute left-0 top-0.5 z-10 m-0 p-0"
				bind:group={selectedConversations}
				value={c} />
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
</ul>
