<script lang="ts">
	import { ConversationHistoryGroup, DeleteButton } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { Link, Star, ArrowDownFromLine, ChevronDown } from 'lucide-svelte';
	import { slide, scale, fly } from 'svelte/transition';
	import dbg from 'debug';
	import { APISearchConversations } from '$lib/api';
	const debug = dbg('app:ui:components:ChatHistory');

	let { deleteConversations }: { deleteConversations: (id: string[]) => Promise<void> } = $props();

	let search: string | undefined = $state(undefined);
	let searchAMP: string = $state('');

	let searchOptionsOpen = $state(false);
	// let searchAMPFocused = $state(false);
	// let searchAMPOptionFocused = $state(false);
	let searchAMPInput: HTMLInputElement | undefined = $state(undefined);

	let searchPublic = $state(false);
	let searchPrivate = $state(false);

	let searchStarred = $state(false);
	let searchUnstarred = $state(false);

	let eagerSearchConversations: string[] = $state([]);
	let eagerSearchGoing = $state(false);

	async function eagerSearch() {
		if (search) {
			eagerSearchGoing = true;
			eagerSearchConversations = await APISearchConversations(search);
			eagerSearchGoing = false;
		} else {
			eagerSearchConversations = [];
		}
	}
	function splitConversations(
		conversatonIds: string[],
		value: string | undefined,
		eagerSearchConversations: string[],
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
		const fromMessages = [];

		const filteredConversations = [];
		for (const c of conversatonIds) {
			const conversation = A.conversations[c];

			// const conversationAMP =
			// 	(conversation.assistantName ?? 'unknown') +
			// 	'/' +
			// 	(conversation.providerName ?? 'unknown') +
			// 	'/' +
			// 	(conversation.modelName ?? 'unknown');

			// Summary match
			if (value && !conversation.summary?.toLowerCase().includes(value.toLowerCase())) {
				if (!eagerSearchConversations.includes(c)) {
					continue;
				} else {
					fromMessages.push(c);
				}
			}

			const ampNotFound =
				amp &&
				!conversation.assistantName?.toLowerCase()?.includes(amp.toLowerCase()) &&
				!conversation.providerName?.toLowerCase().includes(amp.toLowerCase()) &&
				!conversation.modelName?.toLowerCase().includes(amp.toLowerCase());

			if (ampNotFound) continue;

			// Match assistant/model/provider
			// if (amp && !conversationAMP.toLowerCase().includes(amp.toLowerCase())) continue;

			if (searchPublic && !conversation.public) continue;
			if (searchPrivate && conversation.public) continue;

			if (searchStarred && !conversation.like) continue;
			if (searchUnstarred && conversation.like) continue;

			filteredConversations.push(c);
		}

		for (const c of filteredConversations) {
			if (!A.conversations[c].updatedAt) {
				unknownConversations.push(c);
				continue;
			}
			const date = new Date(A.conversations[c].updatedAt);
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
			} else {
				unknownConversations.push(c);
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
			allFiltered: filteredConversations,
			fromMessages
		};
	}

	function findModelsProvidersAssistants(conversationIDs: string[]) {
		const m: { [key: string]: boolean } = {};
		const p: { [key: string]: boolean } = {};
		const a: { [key: string]: boolean } = {};

		debug('findModelsProvidersAssistants', A.hiddenItems);

		const hiddenModels = new Set<string>();
		const hiddenProviders = new Set<string>();
		const hiddenAssistants = new Set<string>();
		A.hiddenItems.forEach((i) => {
			if (A.models[i]) hiddenModels.add(A.models[i].name);
			if (A.providers[i]) hiddenProviders.add(A.providers[i].name);
			if (A.assistants[i]) hiddenAssistants.add(A.assistants[i].name);
		});

		for (const c of conversationIDs) {
			const conversation = A.conversations[c];

			if (
				conversation?.modelName &&
				conversation?.modelName.toLowerCase().includes(searchAMP?.toLowerCase() ?? '') &&
				!hiddenModels.has(conversation.modelName)
			)
				m[conversation.modelName] = true;
			if (
				conversation?.providerName &&
				conversation?.providerName.toLowerCase().includes(searchAMP?.toLowerCase() ?? '') &&
				!hiddenProviders.has(conversation.providerName)
			)
				p[conversation.providerName] = true;
			if (
				conversation?.assistantName &&
				conversation?.assistantName.toLowerCase().includes(searchAMP?.toLowerCase() ?? '') &&
				!hiddenAssistants.has(conversation.assistantName)
			)
				a[conversation.assistantName] = true;
		}

		return {
			assistants: Object.keys(a).sort(),
			models: Object.keys(m).sort(),
			providers: Object.keys(p).sort()
		};
	}

	let datedConversation = $derived(
		splitConversations(
			A.conversationOrder,
			search,
			eagerSearchConversations,
			searchAMP,
			searchPublic,
			searchPrivate,
			searchStarred,
			searchUnstarred
		)
	);
	let historyAMPOptions = $derived(findModelsProvidersAssistants(datedConversation.allFiltered));

	let selectedConversations: string[] = $state([]);
	let deleting = $state(false);

	function selectAll(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.checked) {
			selectedConversations = datedConversation.allFiltered;
		} else {
			selectedConversations = [];
		}
	}

	async function deleteSelected() {
		deleting = true;
		try {
			await deleteConversations(selectedConversations);
		} finally {
			deleting = false;
		}
		selectedConversations = [];
		search = '';
		deleting = false;
	}

	let searchFocused = $state(false);
	let searchAMPdisabled = $derived(
		searchOptionsOpen && (!!searchAMP || searchPublic || searchPrivate || searchStarred || searchUnstarred)
	);

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const buttons = document.querySelectorAll('.ampoption');
			const currentIndex = Array.from(buttons).findIndex((b) => b === event.target);
			let nextIndex;

			if ((event.key === 'Tab' && !event.shiftKey) || event.key === 'ArrowDown') {
				nextIndex = (currentIndex + 1) % buttons.length;
			} else {
				// ArrowUp
				nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
			}

			(buttons[nextIndex] as HTMLElement).focus();
		}

		if (event.key === 'Escape' && event.target) {
			searchAMPInput?.focus();
		}
	}
</script>

<div>
	<div class="relative w-full">
		<input
			type="checkbox"
			class="checkbox absolute left-3 top-1/2 z-10 -translate-y-1/2 transform"
			name="selectAll"
			onchange={(e) => selectAll(e)}
			checked={!!selectedConversations.length &&
				selectedConversations.length === datedConversation.allFiltered.length} />
		{#if selectedConversations.length}
			{#if deleting}
				<span class="loading loading-spinner absolute right-3 top-1/2 -translate-y-1/2 transform"></span>
			{:else}
				<DeleteButton
					class="dropdown-right absolute right-3 top-1/2 z-10 -translate-y-1/2"
					btnClass="btn btn-sm m-0 btn-outline rounded-md p-1"
					deleteAction={deleteSelected} />
			{/if}
		{/if}

		<input
			type="text"
			placeholder="Search chats..."
			class="input input-bordered min-h-12 w-full pl-12"
			name="search-chats"
			bind:value={search}
			onfocus={() => {
				searchFocused = true;
			}}
			onblur={() => {
				searchFocused = false;
			}}
			onkeydown={async (e) => {
				if (e.key === 'Enter') {
					await eagerSearch();
				} else {
					eagerSearchConversations = [];
				}
			}} />
	</div>
	{#if searchFocused || search?.length}
		<div class="w-full pt-0.5 text-right text-sm">
			{#if eagerSearchGoing}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<p>Enter ⇒ search in messages</p>
			{/if}
		</div>
	{/if}
</div>

<div class="divider w-full grow-0">
	<button
		class="btn-outline mx-0 flex h-4 w-fit items-center rounded-full border px-4"
		disabled={searchAMPdisabled}
		class:btn-disabled={searchAMPdisabled}
		class:rotate-180={searchOptionsOpen}
		onclick={() => (searchOptionsOpen = !searchOptionsOpen)}>
		<ChevronDown size={12} />
	</button>
</div>

{#if searchOptionsOpen}
	<div class="relative mx-2 flex flex-col gap-2 rounded-md bg-base-100 p-2 shadow" transition:slide={{ duration: 20 }}>
		<div class="dropdown dropdown-right">
			<input
				type="text"
				role="button"
				tabindex="0"
				class="input input-sm input-bordered"
				placeholder="Assistant/Provider/Model"
				onkeydown={handleKeyDown}
				bind:this={searchAMPInput}
				bind:value={searchAMP} />

			{#if true}
				<div
					class="dropdown-content left-full top-2 z-40 ml-1 flex w-fit flex-col justify-start rounded-md bg-base-200 shadow-lg">
					{#if historyAMPOptions.assistants.length}
						<div class="divider w-full py-0">Assistants</div>
					{/if}

					{#each historyAMPOptions.assistants as option}
						<!-- data-index={optionIndex++} -->
						<button
							class="ampoption btn btn-ghost btn-xs cursor-pointer justify-start text-nowrap px-4 py-0 text-sm"
							tabindex="0"
							onclick={(e) => {
								searchAMP = option;
								searchAMPInput?.focus();
							}}
							onkeydown={handleKeyDown}>
							{option}
						</button>
					{/each}

					{#if historyAMPOptions.providers.length}
						<div class="divider w-full py-0">Providers</div>
					{/if}

					{#each historyAMPOptions.providers as option}
						<button
							class="ampoption btn btn-ghost btn-xs cursor-pointer justify-start text-nowrap px-4 py-0 text-sm"
							tabindex="0"
							onclick={() => {
								searchAMP = option;
								searchAMPInput?.focus();
							}}
							onkeydown={handleKeyDown}>
							{option}
						</button>
					{/each}

					{#if historyAMPOptions.models.length}
						<div class="divider w-full py-0">Models</div>
					{/if}

					{#each historyAMPOptions.models as option}
						<button
							class="ampoption btn btn-ghost btn-xs cursor-pointer justify-start text-nowrap px-4 py-0 text-sm"
							tabindex="0"
							onclick={() => {
								searchAMP = option;
								searchAMPInput?.focus();
							}}
							onkeydown={handleKeyDown}>
							{option}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<div class="flex gap-6 p-2">
			<div class="flex items-center gap-2">
				<label for="oplyPublic"><Link size={20} /></label>
				<input
					type="checkbox"
					id="oplyPublic"
					class="checkbox"
					bind:checked={searchPublic}
					onchange={() => (searchPrivate = false)} />
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
					onchange={() => (searchPublic = false)} />
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
					onchange={() => (searchUnstarred = false)} />
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
					onchange={() => (searchStarred = false)} />
			</div>
		</div>
	</div>
{/if}

<ul class="base-200 no-scrollbar menu flex w-full flex-nowrap overflow-y-auto p-0">
	{#if datedConversation.today.length}
		<ConversationHistoryGroup
			title="Today"
			group={datedConversation.today}
			bind:selectedConversations
			fromMessages={datedConversation.fromMessages} />
	{/if}

	{#if datedConversation.yesterday.length}
		<ConversationHistoryGroup
			title="Yesterday"
			group={datedConversation.yesterday}
			bind:selectedConversations
			fromMessages={datedConversation.fromMessages} />
	{/if}

	{#if datedConversation.lastWeek.length}
		<ConversationHistoryGroup
			title="Last Week"
			group={datedConversation.lastWeek}
			bind:selectedConversations
			fromMessages={datedConversation.fromMessages} />
	{/if}

	{#if datedConversation.lastMonth.length}
		<ConversationHistoryGroup
			title="Last Month"
			group={datedConversation.lastMonth}
			bind:selectedConversations
			fromMessages={datedConversation.fromMessages} />
	{/if}

	{#if datedConversation.unknown.length}
		<ConversationHistoryGroup
			title="Older"
			group={datedConversation.unknown}
			bind:selectedConversations
			fromMessages={datedConversation.fromMessages} />
	{/if}
	<div class="mb-14"></div>
</ul>
<div class="grow"></div>
