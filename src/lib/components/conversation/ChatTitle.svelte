<script lang="ts">
	import { APIupsertConversation, APIupsertMessage } from '$lib/api';
	import { ConversationAssistant, ConversationInfo, Cost, ProfileCircle, ShareConversation } from '$lib/components';
	import {
		chatDataLoading,
		sidebarOpen,
		conversation,
		conversations,
		conversationOrder,
		dbUser,
		isMobile
	} from '$lib/stores/appstate';
	import dbg from 'debug';
	import { ArrowLeftCircle, Edit, Info, Star, CopyPlus } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';

	const debug = dbg('app:ui:conponents:ChatTitle');

	export let isPublic = false;
	let editingSummary = false;
	let updatingLike = false;
	let cloningConversation = false;

	async function updateConversation() {
		if (!$conversation || !$conversation.id) return;

		await APIupsertConversation($conversation);
		// Trigger an update of the chat history
		$conversationOrder = $conversationOrder;
		$conversation = $conversation;
	}

	async function updateLike() {
		if (!$conversation || !$conversation.id) return;

		updatingLike = true;
		try {
			await updateConversation();
		} catch (e) {
			debug('Failed to update like:', e);
			$conversation.like = !$conversation.like;
		}
		updatingLike = false;
	}

	async function updateSummary() {
		if (!$conversation || !$conversation.id) return;

		editingSummary = false;
		await updateConversation();
	}

	async function cloneConversation() {
		debug('cloneConversation', { $conversation });
		if (!$conversation || !$dbUser) return;

		cloningConversation = true;

		const clone = { ...$conversation };
		delete clone.id;
		clone.summary = '+' + clone.summary;
		clone.public = false;
		clone.order = undefined;
		clone.userID = $dbUser.id;
		clone.updatedAt = undefined;
		clone.createdAt = undefined;
		const insertedConversation = await APIupsertConversation(clone);
		debug('insertedConversation', { insertedConversation });
		if (!insertedConversation?.id) return;

		insertedConversation.messages = [];

		// We have to inser one by one to make sure the order is set correctly.
		for (const m of clone.messages ?? []) {
			delete m.id;
			m.conversationId = insertedConversation.id;
			m.userID = $dbUser.id;
			m.order = undefined;
			m.createdAt = undefined;
			m.updatedAt = undefined;

			const insertedMessage = await APIupsertMessage(m);
			debug('insertedMessage', { insertedMessage });
			insertedConversation.messages.push(insertedMessage);
		}

		$conversations[insertedConversation.id] = insertedConversation;
		$conversationOrder = [insertedConversation.id, ...$conversationOrder];
		cloningConversation = false;
		await goto('/chat/' + insertedConversation.id);
	}
</script>

<div class="navbar mx-0 min-h-12 w-full min-w-0 items-center gap-4 bg-base-100">
	<div class="flex gap-2 min-w-0">
		{#if isPublic}
			<a class="link flex gap-2 text-ellipsis text-nowrap" href="/chat">
				<ArrowLeftCircle />Congusto Chat
			</a>
		{/if}

		{#if $conversation?.id && !$sidebarOpen}
			<a href={'/chat/'} class="link"><Edit /></a>
		{/if}

		{#if $conversation?.id && !isPublic && !$isMobile}
			{#if updatingLike}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<label class="swap">
					<input type="checkbox" bind:checked={$conversation.like} on:change={updateLike} />
					<div class="swap-on"><Star color="var(--star)" fill="var(--star)" /></div>
					<div class="swap-off"><Star color="var(--star)" /></div>
				</label>
			{/if}
		{/if}
		<button
			class="btn btn-sm rounded-md bg-base-100 p-1"
			title="Clone conversation"
			on:click={async () => await cloneConversation()}>
			{#if cloningConversation}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<CopyPlus />
			{/if}
		</button>

		{#if !isPublic}
			<ConversationAssistant />
		{/if}
	</div>
	<!-- navbar-center -->
	<div class="min-w-0 shrink-[2] grow">
		<div class="flex w-full text-ellipsis text-center text-xl font-bold">
			{#if !$chatDataLoading}
				{#if $conversation}
					{#if editingSummary}
						<input
							type="text"
							class="input input-sm input-bordered w-full grow"
							bind:value={$conversation.summary}
							on:blur={() => (editingSummary = false)}
							on:keypress={async (e) => e.key === 'Enter' && (await updateSummary())} />
					{:else}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<p
							class="cursor-pointer truncate"
							on:dblclick={() => {
								if (!isPublic) editingSummary = true;
							}}>
							{$conversation.summary ?? 'New chat'}
						</p>
					{/if}
				{/if}
			{:else}
				<div class="loading"></div>
			{/if}
		</div>
	</div>

	<!-- navbar-end -->
	<div class="mx-2 ml-auto grow-0 gap-2 justify-self-end ">
		{#if $conversation?.id && !isPublic}
			<ShareConversation {updateConversation} />
		{/if}

		<Cost total={($conversation?.tokensInCost ?? 0) + ($conversation?.tokensOutCost ?? 0)} />
		<details class="dropdown-botton dropdown dropdown-end hidden md:block">
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<summary class="mt-auto block text-center" tabindex={0}><Info /></summary>
			<div class="dropdown-content z-30 flex max-h-dvh w-max max-w-screen-md whitespace-pre-line p-2 pb-20">
				<ConversationInfo />
			</div>
		</details>

		{#if !isPublic}
			<ProfileCircle />
		{/if}
	</div>
</div>
