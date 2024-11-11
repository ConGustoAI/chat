<script lang="ts">
	import { APIupsertConversation, APIupsertMedia, APIupsertMessage, messageInterfaceFilter } from '$lib/api';
	import { ConversationAssistant, ConversationInfo, Cost, ProfileCircle, ShareConversation } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	import { ArrowLeftCircle, Edit, Info, Star, CopyPlus } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { trimLineLength, assert, isPublicPage } from '$lib/utils/utils';
	import { syncMedia, uploadConversationMedia } from '$lib/utils/media_utils.svelte';
	import { sanityCheckConversationMedia } from '$lib/utils/sanity-check.svelte';

	const debug = dbg('app:ui:conponents:ChatTitle');

	let editingSummary = $state(false);
	let updatingLike = $state(false);
	let cloningConversation = $state(false);

	let detailsOpen = $state(false);
	let summaryElement: HTMLElement;

	function closeDetails() {
		detailsOpen = false;
		if (summaryElement) summaryElement.blur();
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDetails();
		}
	}

	async function updateLike() {
		if (!A.conversation || !A.conversation.id) return;

		updatingLike = true;
		try {
			Object.assign(A.conversation, await APIupsertConversation(A.conversation));
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
		Object.assign(A.conversation, await APIupsertConversation(A.conversation));
	}

	async function cloneConversation() {
		debug('cloneConversation', { conversation: A.conversation });
		if (!A.conversation || !A.user) return;

		cloningConversation = true;

		// All media in the conversation should now have IDs.
		await uploadConversationMedia();

		sanityCheckConversationMedia(A.conversation);

		let clone = { ...$state.snapshot(A.conversation) } as ConversationInterface;
		clone.id = undefined;
		clone.summary = trimLineLength('+' + (clone.summary ?? 'New Chat'), 128);
		clone.public = false;
		clone.order = undefined;
		clone.userID = A.user.id;
		clone.updatedAt = undefined;
		clone.createdAt = undefined;

		// Make it a $state?
		clone = (await APIupsertConversation(clone)) as ConversationInterface;
		debug('inserted clone conversation: ', clone);
		assert(clone.id);
		clone.messages = [];
		clone.media = [];

		// Maps between the IDs of the original and cloned media.
		const mediaConversionTable = new Map<string, string>();

		const mediaPromises = (A.conversation.media ?? []).map(async (media) => {
			assert(media.id);
			let mediaClone = { ...media } as MediaInterface;
			mediaClone.id = undefined;
			mediaClone.conversationID = clone.id;
			mediaClone.userID = A.user!.id;
			mediaClone.createdAt = undefined;
			mediaClone.updatedAt = undefined;

			Object.assign(mediaClone, await APIupsertMedia(mediaClone));
			debug('inserted media clone', mediaClone);
			assert(mediaClone.id);
			syncMedia(mediaClone);

			mediaConversionTable.set(media.id, mediaClone.id);
			clone.media!.push(mediaClone);
		});

		await Promise.all(mediaPromises);

		// We have to inser one by one to make sure the order is set correctly.
		const messagePromises = (A.conversation.messages ?? []).map(async (m) => {
			let messageClone = { ...$state.snapshot(m) } as MessageInterface;
			messageClone.id = undefined;
			messageClone.conversationID = clone.id;
			messageClone.userID = A.user!.id;
			// Note: We don't reset the message order. The order does not have to be unique between conversations.
			messageClone.createdAt = undefined;
			messageClone.updatedAt = undefined;
			messageClone.media = [];
			messageClone.mediaIDs = [];

			// Replace the media and IDs with the cloned ones.
			for (const media of m.media ?? []) {
				assert(media.id);
				const clonedMedia = clone.media!.find((m) => m.id === mediaConversionTable.get(media.id!));
				assert(clonedMedia?.id);

				messageClone.media.push(clonedMedia);
				messageClone.mediaIDs.push(clonedMedia.id);
			}

			Object.assign(messageClone, await APIupsertMessage(messageClone));
			debug('inserted message clone ', messageClone);
			return messageClone;
		});

		clone.messages = await Promise.all(messagePromises);

		sanityCheckConversationMedia(clone);

		A.conversations[clone.id] = clone;
		A.conversationOrder = [clone.id, ...A.conversationOrder];

		cloningConversation = false;
		await goto('/chat/' + clone.id);
	}

	let summaryHovered = $state(false);
	let savedSummary: string;
</script>

<div class="navbar mx-0 min-h-12 w-full min-w-0 items-center gap-4 border-b border-base-content bg-base-200">
	<!-- navbar-start -->
	<div class="flex min-w-0 shrink-0 gap-2">
		{#if isPublicPage()}
			<a class="link flex gap-2 text-ellipsis text-nowrap" href="/chat">
				<ArrowLeftCircle />Congusto Chat
			</a>
		{/if}

		{#if A.conversation?.id && !A.sidebarOpen}
			<a href={'/chat/'} class="link"><Edit /></a>
		{/if}

		{#if A.conversation?.id && !isPublicPage() && !A.isMobile}
			{#if updatingLike}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<label class="swap" aria-label="Star conversation">
					<input
						aria-label="Star conversation"
						type="checkbox"
						bind:checked={A.conversation.like}
						onchange={updateLike} />
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

		{#if !isPublicPage()}
			<ConversationAssistant />
		{/if}
	</div>
	<!-- navbar-center -->
	<div class="flex min-w-0 shrink-[2] grow overflow-hidden">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex w-full text-ellipsis text-center text-xl font-bold"
			onmouseenter={() => {
				summaryHovered = true;
			}}
			onmouseleave={() => {
				summaryHovered = false;
			}}>
			{#if !A.chatDataLoading}
				{#if A.conversation}
					{#if editingSummary}
						<input
							aria-label="Conversation summary"
							type="text"
							class="input input-sm input-bordered w-full grow"
							bind:value={A.conversation.summary}
							onblur={async () => {
								await updateSummary();
								editingSummary = false;
							}}
							onkeydown={async (e) => {
								if (e.key === 'Enter') await updateSummary();
								if (e.key === 'Escape') {
									editingSummary = false;
									A.conversation!.summary = savedSummary;
								}
							}} />
					{:else}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							aria-label="Conversation summary"
							class="items-bottom flex w-full shrink cursor-pointer gap-1"
							role="textbox"
							tabindex="0"
							ondblclick={() => {
								savedSummary = A.conversation!.summary ?? '';
								editingSummary = true;
							}}>
							<p class="shrink truncate">
								{A.conversation.summary ?? 'New chat'}
							</p>
							{#if summaryHovered && !isPublicPage()}
								<button
									class="btn btn-ghost btn-xs shrink-0 rounded-md p-0"
									onclick={() => {
										savedSummary = A.conversation!.summary ?? '';
										editingSummary = true;
									}}><Edit size="h-fit" /></button>
							{/if}
						</div>
					{/if}
				{/if}
			{:else}
				<div class="loading"></div>
			{/if}
		</div>
	</div>

	<!-- navbar-end -->
	<div class="mx-2 ml-auto grow-0 gap-2 justify-self-end">
		{#if A.conversation?.id && !isPublicPage()}
			<ShareConversation />
		{/if}

		<Cost total={(A.conversation?.tokensInCost ?? 0) + (A.conversation?.tokensOutCost ?? 0)} />

		<details class="dropdown-botton dropdown dropdown-end hidden sm:block" bind:open={detailsOpen}>
			<summary class="mt-auto block text-center"><Info /></summary>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="dropdown-content z-30 flex max-h-dvh w-max max-w-screen-md whitespace-pre-line p-2 pb-20"
				onkeydown={handleKeydown}
				tabindex="-1">
				<ConversationInfo />
			</div>
		</details>
		{#if detailsOpen}
			<button class="fixed inset-0 z-20" onclick={closeDetails} aria-label="Close modal"></button>
		{/if}

		{#if !isPublicPage()}
			<ProfileCircle />
		{/if}
	</div>
</div>
