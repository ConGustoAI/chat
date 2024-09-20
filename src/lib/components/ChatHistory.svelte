<script lang="ts">
	import { ConversationHistoryGroup, DeleteButton } from '$lib/components';
	import { conversationOrder, conversations } from '$lib/stores/appstate';
	import { Link, Star, ArrowDownFromLine, ChevronDown } from 'lucide-svelte';
	import { slide, scale, fly } from 'svelte/transition';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:ChatHistory');

	export let deleteConversations: (id: string[]) => Promise<void>;

	let seach: string | undefined;
	let searchAMP: string | undefined;

	let searchOptionsOpen = false;
	let searchAMPFocused = false;

	let searchPublic = false;
	let searchPrivate = false;

	let searchStarred = false;
	let searchUnstarred = false;

	function splitConversations(
		conversatonIds: string[],
		value: string | undefined,
		amp: string | undefined,
		searchPublic: boolean,
		searchPrivate: boolean,
		searchStarred: boolean,
		searchUnstarred: boolean
	) {
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

			if (searchPublic && !conversation.public) continue;
			if (searchPrivate && conversation.public) continue;

			if (searchStarred && !conversation.like) continue;
			if (searchUnstarred && conversation.like) continue;

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

		debug('splitConversations', {
			todayConversations,
			yesterdayConversations,
			lastWeekConversations,
			lastMonthConversations,
			unknownConversations
		});

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

	$: datedConversation = splitConversations(
		$conversationOrder,
		seach,
		searchAMP,
		searchPublic,
		searchPrivate,
		searchStarred,
		searchUnstarred
	);
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
		bind:value={seach} />
</div>

<div class="divider w-full grow-0">
	<button
		class="btn-outline mx-0 flex h-4 w-fit items-center rounded-full border px-4"
		class:rotate-180={searchOptionsOpen}
		on:click={() => (searchOptionsOpen = !searchOptionsOpen)}>
		<ChevronDown size={12} />
	</button>
</div>

{#if searchOptionsOpen}
	<div class="relative mx-2 flex flex-col gap-2 rounded-md bg-base-100 p-2 shadow" transition:slide={{ duration: 20 }}>
		<input
			type="text"
			class="input input-sm input-bordered"
			placeholder="Assistant/Provider/Model"
			on:focus={() => (searchAMPFocused = true)}
			on:blur={() => {
				setTimeout(() => {
					searchAMPFocused = false;
				}, 1000);
			}}
			bind:value={searchAMP} />

		{#if searchAMPFocused || searchAMP?.length}
			<div
				class="absolute left-full top-2 z-40 ml-1 flex w-fit flex-col justify-start rounded-md bg-base-200 shadow-lg">
				{#each historyAMPOptions as option}
					<button
						class="btn btn-ghost cursor-pointer text-nowrap px-4 py-2 text-start"
						on:click={() => (searchAMP = option)}>
						{option}
					</button>
				{/each}
			</div>
		{/if}
		<div class="flex gap-6 p-2">
			<div class="flex items-center gap-2">
				<label for="oplyPublic"><Link size={20} /></label>
				<input
					type="checkbox"
					id="oplyPublic"
					class="checkbox"
					bind:checked={searchPublic}
					on:change={() => (searchPrivate = false)} />
			</div>
			<div class="flex items-center gap-2">
				<label for="oplyPrivate">
					<div class="relative">
						<Link size={20} />
						<div class="absolute left-0 top-1/2 h-0.5 w-full -rotate-45 transform bg-red-500"></div>
					</div>
				</label>
				<input
					type="checkbox"
					id="oplyPrivate"
					class="checkbox"
					bind:checked={searchPrivate}
					on:change={() => (searchPublic = false)} />
			</div>
		</div>
		<div class="flex gap-6 p-2">
			<div class="flex items-center gap-2">
				<label for="oplyStarred"><Star color="yellow" fill="yellow" size={20} /></label>
				<input
					type="checkbox"
					id="oplyStarred"
					class="checkbox"
					bind:checked={searchStarred}
					on:change={() => (searchUnstarred = false)} />
			</div>
			<div class="flex items-center gap-2">
				<label for="oplyUnstarred">
					<div class="relative">
						<Star color="yellow" size={20} />
					</div>
				</label>
				<input
					type="checkbox"
					id="oplyUnstarred"
					class="checkbox"
					bind:checked={searchUnstarred}
					on:change={() => (searchStarred = false)} />
			</div>
		</div>
	</div>
{/if}

<ul class="base-200 no-scrollbar menu flex w-full overflow-y-auto p-0">
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
<div class="grow" />
