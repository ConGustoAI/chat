<script lang="ts">
	import { APIupsertConversation, APIupsertMessage } from '$lib/api';
	import { ConversationAssistant, ConversationInfo, Cost, ProfileCircle, ShareConversation } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	import { ArrowLeftCircle, Edit, Info, Star, CopyPlus } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { trimLineLength } from '$lib/utils';

	const debug = dbg('app:ui:conponents:ChatTitle');

	let { isPublic = false } = $props();
	let editingSummary = $state(false);
	let updatingLike = $state(false);
	let cloningConversation = $state(false);

	async function updateConversation() {
		if (!A.conversation || !A.conversation.id) return;

		await APIupsertConversation(A.conversation);
		// Trigger an update of the chat history
		// conversationOrder = conversationOrder;
		// conversation = conversation;
	}

	async function updateLike() {
		if (!A.conversation || !A.conversation.id) return;

		updatingLike = true;
		try {
			await updateConversation();
		} catch (e) {
			debug('Failed to update like:', e);
			A.conversation.like = !A.conversation.like;
		}
		updatingLike = false;
	}

	async function updateSummary() {
		if (!A.conversation || !A.conversation.id) return;
		if (A.conversation.summary) A.conversation.summary = trimLineLength(A.conversation.summary, 128);
		editingSummary = false;
		await updateConversation();
	}

	async function cloneConversation() {
		debug('cloneConversation', { conversation: A.conversation });
		if (!A.conversation || !A.dbUser) return;

		cloningConversation = true;

		const clone = { ...A.conversation };
		delete clone.id;
		clone.summary = trimLineLength('+' + clone.summary, 128);
		clone.public = false;
		clone.order = undefined;
		clone.userID = A.dbUser.id;
		clone.updatedAt = undefined;
		clone.createdAt = undefined;
		const insertedConversation = await APIupsertConversation(clone);
		debug('insertedConversation', { insertedConversation });
		if (!insertedConversation?.id) return;

		insertedConversation.messages = [];

		// We have to inser one by one to make sure the order is set correctly.
		for (const m of clone.messages ?? []) {
			delete m.id;
			m.conversationID = insertedConversation.id;
			m.userID = A.dbUser.id;
			m.order = undefined;
			m.createdAt = undefined;
			m.updatedAt = undefined;

			const insertedMessage = await APIupsertMessage(m);
			debug('insertedMessage', { insertedMessage });
			insertedConversation.messages.push(insertedMessage);
		}

		A.conversations[insertedConversation.id] = insertedConversation;
		A.conversationOrder = [insertedConversation.id, ...A.conversationOrder];
		cloningConversation = false;
		await goto('/chat/' + insertedConversation.id);
	}
</script>

<div class="navbar mx-0 min-h-12 w-full min-w-0 items-center gap-4 bg-base-100">
	<!-- navbar-start -->
	<div class="flex min-w-0 shrink-0 gap-2">
		{#if isPublic}
			<a class="link flex gap-2 text-ellipsis text-nowrap" href="/chat">
				<ArrowLeftCircle />Congusto Chat
			</a>
		{/if}

		{#if A.conversation?.id && !A.sidebarOpen}
			<a href={'/chat/'} class="link"><Edit /></a>
		{/if}

		{#if A.conversation?.id && !isPublic && !A.isMobile}
			{#if updatingLike}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<label class="swap">
					<input type="checkbox" bind:checked={A.conversation.like} onchange={updateLike} />
					<div class="swap-on"><Star color="var(--star)" fill="var(--star)" /></div>
					<div class="swap-off"><Star color="var(--star)" /></div>
				</label>
			{/if}
		{/if}
		{#if A.conversation?.id}
			<button
				class="btn btn-sm rounded-md bg-base-100 p-1"
				title="Clone conversation"
				onclick={async () => await cloneConversation()}>
				{#if cloningConversation}
					<span class="loading loading-spinner loading-xs"></span>
				{:else}
					<CopyPlus />
				{/if}
			</button>
		{/if}

		{#if !isPublic}
			<ConversationAssistant />
		{/if}
	</div>
	<!-- navbar-center -->
	<div class="min-w-0 shrink-[2] grow">
		<div class="flex w-full text-ellipsis text-center text-xl font-bold">
			{#if !A.chatDataLoading}
				{#if A.conversation}
					{#if editingSummary}
						<input
							type="text"
							class="input input-sm input-bordered w-full grow"
							bind:value={A.conversation.summary}
							onblur={() => (editingSummary = false)}
							onkeypress={async (e) => e.key === 'Enter' && (await updateSummary())} />
					{:else}
						<p
							class="cursor-pointer truncate"
							ondblclick={() => {
								if (!isPublic) editingSummary = true;
							}}>
							{A.conversation.summary ?? 'New chat'}
						</p>
					{/if}
				{/if}
			{:else}
				<div class="loading"></div>
			{/if}
		</div>
	</div>

	<!-- navbar-end -->
	<div class="mx-2 ml-auto grow-0 gap-2 justify-self-end">
		{#if A.conversation?.id && !isPublic}
			<ShareConversation {updateConversation} />
		{/if}

		<Cost total={(A.conversation?.tokensInCost ?? 0) + (A.conversation?.tokensOutCost ?? 0)} />
		<details class="dropdown-botton dropdown dropdown-end hidden md:block">
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
