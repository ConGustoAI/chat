<script lang="ts">
	import { ConversationHistoryGroup, DeleteButton } from '$lib/components';
	import { conversationOrder, conversations } from '$lib/stores/appstate';

	export let deleteConversations: (id: string[]) => Promise<void>;

	let seachValue: string | undefined;

	function splitConversations(conversatonIds: string[], seachValue: string | undefined) {
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const lastWeek = new Date();
		lastWeek.setDate(lastWeek.getDate() - 7);
		const lastMonth = new Date();
		lastMonth.setMonth(lastMonth.getMonth() - 1);

		const todayConversations = [];
		const yesterdayConversations = [];
		const lastWeekConversations = [];
		const lastMonthConversations = [];
		const unknownConversations = [];

		const filteredConversations = conversatonIds.filter(
			(c) => !seachValue || $conversations[c].summary?.toLowerCase().includes(seachValue.toLowerCase())
		);

		for (const c of filteredConversations) {
			if (!$conversations[c].updatedAt) {
				unknownConversations.push(c);
				continue;
			}
			const date = new Date($conversations[c].updatedAt);
			if (
				date.getDate() === today.getDate() &&
				date.getMonth() === today.getMonth() &&
				date.getFullYear() === today.getFullYear()
			) {
				todayConversations.push(c);
			} else if (
				date.getDate() === yesterday.getDate() &&
				date.getMonth() === yesterday.getMonth() &&
				date.getFullYear() === yesterday.getFullYear()
			) {
				yesterdayConversations.push(c);
			} else if (date > lastWeek) {
				lastWeekConversations.push(c);
			} else if (date > lastMonth) {
				lastMonthConversations.push(c);
			}
		}

		return {
			today: todayConversations,
			yesterday: yesterdayConversations,
			lastWeek: lastWeekConversations,
			lastMonth: lastMonthConversations,
			unknown: unknownConversations,
			allFiltered: filteredConversations
		};
	}

	$: datedConversation = splitConversations($conversationOrder, seachValue);

	let selectedConversations: string[] = [];
	let deleting = false;

	export function selectAll(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.checked) {
			selectedConversations = datedConversation.allFiltered;
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
		checked={!!selectedConversations.length && selectedConversations.length === datedConversation.allFiltered.length} />
	{#if selectedConversations.length}
		{#if deleting}
			<span class="loading loading-spinner absolute right-3 top-1/2 -translate-y-1/2 transform" />
		{:else}
			<DeleteButton
				class="dropdown-right absolute right-3 top-1/2 z-10 -translate-y-1/2"
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
	{#if datedConversation.today.length}
		<ConversationHistoryGroup title="Today" group={datedConversation.today} bind:selectedConversations />
	{/if}

	{#if datedConversation.yesterday.length}
		<ConversationHistoryGroup title="Yesterday" group={datedConversation.yesterday} bind:selectedConversations />
	{/if}

	{#if datedConversation.lastWeek.length}
		<ConversationHistoryGroup title="Last Week" group={datedConversation.lastWeek} bind:selectedConversations />
	{/if}

	{#if datedConversation.lastMonth.length}
		<ConversationHistoryGroup title="Last Month" group={datedConversation.lastMonth} bind:selectedConversations />
	{/if}

	{#if datedConversation.unknown.length}
		<ConversationHistoryGroup title="Older" group={datedConversation.unknown} bind:selectedConversations />
	{/if}
</ul>
