<script lang="ts">
	import { ConversationHistoryGroup, DeleteButton } from '$lib/components';
	import { conversationOrder, conversations } from '$lib/stores/appstate';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:ChatHistory');

	export let deleteConversations: (id: string[]) => Promise<void>;

	let seach: string | undefined;
	let searchFocused = false;
	let searchAMP: string | undefined;
	let searchAMPFocused = false;
	let focusedInputs = 0;

	function splitConversations(conversatonIds: string[], value: string | undefined, amp: string | undefined) {
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

		const filteredConversations = [];
		for (const c of conversatonIds) {
			const conversation = $conversations[c];

			const conversationAMP =
				(conversation.assistantName ?? 'unknown') +
				'/' +
				(conversation.providerName ?? 'unknown') +
				'/' +
				(conversation.modelName ?? 'unknown');

			// Summary match
			if (value && !conversation.summary?.toLowerCase().includes(value.toLowerCase())) continue;
			// Match assistant/model/provider
			if (amp && !conversationAMP.toLowerCase().includes(amp.toLowerCase())) continue;
			debug(conversationAMP);
			filteredConversations.push(c);
		}

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

	function findModelsProvidersAssistants(conversationIds: string[]) {
		const m: { [key: string]: boolean } = {};
		const p: { [key: string]: boolean } = {};
		const a: { [key: string]: boolean } = {};
		for (const c of conversationIds) {
			const conversation = $conversations[c];

			if (conversation?.modelName) m[conversation.modelName] = true;
			if (conversation?.providerName) p[conversation.providerName] = true;
			if (conversation?.assistantName) a[conversation.assistantName] = true;
		}
		return [...Object.keys(a), ...Object.keys(m), ...Object.keys(p)];
	}

	$: datedConversation = splitConversations($conversationOrder, seach, searchAMP);
	$: historyAMPOptions = findModelsProvidersAssistants(datedConversation.allFiltered);

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
		seach = '';
		deleting = false;
	}

	function handleSearchFocus() {
		focusedInputs++;
		searchFocused = true;
	}

	function handleSearchBlur() {
		// setTimeout lets us process the next focus event before the blur event.
		setTimeout(() => {
			focusedInputs--;
			if (focusedInputs <= 0) {
				searchFocused = false;
			}
		}, 0);
	}

	function handleSearchAMPFocus() {
		searchAMPFocused = true;
		focusedInputs++;
	}

	function handleSearchAMPBlur() {
		searchAMPFocused = false;
		setTimeout(() => {
			focusedInputs--;
			if (focusedInputs <= 0) {
				searchAMPFocused = false;
			}
		}, 0);
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
		bind:value={seach}
		on:focus={handleSearchFocus}
		on:blur={handleSearchBlur} />
</div>

{#if searchFocused}
	<div class="relative flex flex-col gap-2 rounded-md bg-base-100 p-2 shadow transition-all">
		<input
			type="text"
			class="input input-sm input-bordered"
			placeholder="Assistant/Provider/Model"
			bind:value={searchAMP}
			on:focus={handleSearchAMPFocus}
			on:blur={handleSearchAMPBlur} />

		{#if searchAMPFocused}
			<div class="absolute left-full top-2 z-40 ml-1 flex w-fit flex-col justify-start rounded-md shadow-lg bg-base-200">
				{#each historyAMPOptions as option}
					<button class="cursor-pointer text-nowrap px-4 py-2 text-start" on:click={() => (searchAMP = option)}>
						{option}
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

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
