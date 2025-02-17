<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIdeleteMessages, APIupsertConversation, APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import {
		CostEstimate,
		GrowInput,
		MarkdownMessage,
		MediaCarousel,
		MessageInfo,
		MessageMediaPreview
	} from '$lib/components';
	import 'highlight.js/styles/github-dark.min.css';
	import 'katex/dist/katex.min.css';
	import { Computer, PlusCircle, Smile, StepForward } from 'lucide-svelte';

	import { ChatMessageControls, Notification } from '$lib/components';
	import { handleDataTransfer, uploadConversationMedia } from '$lib/utils/media_utils.svelte';
	import { isPublicPage, trimLineLength } from '$lib/utils/utils';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:ChatMessage');

	let {
		submitConversation,
		message = $bindable(),
		loading = false
	}: {
		submitConversation: () => Promise<void>;
		message: MessageInterface;
		loading?: boolean;
	} = $props();

	let chatError: string | undefined = $state();
	let markdown = $state(message.role === 'assistant');

	let savingMessage = $state(false);

	let detailsOpen = $state(false);

	let summaryElement: HTMLElement|undefined = undefined;

	function closeDetails() {
		console.log('closeDetails');
		detailsOpen = false;
		if (summaryElement) summaryElement.blur();
	}

	async function sendEditedMessage() {
		debug('sendEditedMessage', { conversation: A.conversation, message });

		if (!A.conversation || !A.conversation.messages || !A.conversation.messages.length || !message) return;

		const currentIndex = A.conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;
		// Mark the rest as deleted.
		const toDelete = A.conversation.messages
			.slice(currentIndex + 1)
			.filter((m) => m.id)
			.map((m) => m.id) as string[];

		const deletePromise = APIdeleteMessages(toDelete);

		A.conversation.messages = A.conversation.messages.slice(0, currentIndex + 1);
		if (message.role === 'user')
			A.conversation.messages.push({ userID: A.conversation.userID, role: 'assistant', text: '' });
		try {
			// Update the conversation
			await submitConversation();
			chatError = undefined;
		} catch (e) {
			chatError = (e as Error).message ?? 'An unknown error occurred';
		}
		await deletePromise;
	}

	async function saveMessage() {
		debug('saveMessage', { conversation: A.conversation, message });

		message.uploadOpen = false;
		let newConversation = false;
		if (!A.conversation || !A.conversation.messages || !A.conversation.messages.length || !message) return;

		// Sanity check
		const currentIndex = A.conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) throw new Error('Current message not part of current conversation');

		if (!A.conversation.id) {
			A.conversation.summary = trimLineLength(message.text, 128);
			A.conversation = { ...A.conversation, ...(await APIupsertConversation(A.conversation)) };
			newConversation = true;
		}

		for (const m of A.conversation.messages || []) {
			m.conversationID = A.conversation.id;
		}

		await uploadConversationMedia();
		message.mediaIDs = message.media?.map((m) => m.id!) ?? [];

		savingMessage = true;
		Object.assign(message, await APIupsertMessage(message));
		savingMessage = false;
		if (newConversation) await goto(`/chat/${A.conversation.id}`);
	}

	async function inputKeyboardHandler(event: KeyboardEvent) {
		if (message.editing && A.conversation) {
			if (event.key === 'Enter' && event.ctrlKey) {
				event.preventDefault();
				message.markdownCache = undefined;
				message.editing = false;
				A.conversationUploadOpen = false;
				message.uploadOpen = false;
				await sendEditedMessage();
			} else if (event.key === 'Escape') {
				message.text = message.originalText ?? '';
				message.editing = false;
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDetails();
		}
	}

	async function handlePaste(event: ClipboardEvent) {
		debug('handlePaste', event.clipboardData?.getData('text/plain'));
		event.preventDefault();
		if (event.clipboardData)
			await handleDataTransfer({
				data: event.clipboardData,
				handle_string: true,
				message
			});
	}

	function shouldShowDivider() {
		let idx = A.conversation?.messages?.findIndex((m) => m === message);
		if (!idx) return false;
		const pm = A.conversation?.messages?.[idx - 1];
		if (pm?.role === message.role) return true;
	}

	let inputFocus = $state(false);

	let dragging = $state(0);

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		debug('Drop event', event);
		if (message.role === 'assistant') return;
		dragging = 0;
		A.messageDragging = 0;
		if (event.dataTransfer)
			await handleDataTransfer({
				data: event.dataTransfer,
				message: message
			});
	}

	function dragEnter(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		debug('Drag enter');
		A.messageDragging++;
		dragging++;
	}

	function dragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();

		debug('Drag leave');
		A.messageDragging--;
		dragging--;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault(); // This is crucial!
		event.stopPropagation();
	}
</script>

{#if shouldShowDivider()}
	<div class="divider w-full grow-0" style="margin: 0;"></div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex flex-col"
	ondragenter={dragEnter}
	ondragleave={dragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}>
	{#if message.media?.length || ((message.editing || dragging) && message.role === 'user')}
		<div class="flex flex-col bg-base-usermessage">
			<div
				class="carousel carousel-center ml-10 max-w-full shrink-0 items-end gap-2 bg-base-usermessage p-2"
				role="region"
				aria-label="Image upload area">
				{#if (message.editing || dragging) && message.role === 'user'}
					<button
						class="btn btn-outline h-12 w-12 p-2"
						onclick={() => {
							message.uploadOpen = !message.uploadOpen;
							if (message.uploadOpen) {
								A.conversationUploadOpen = false;
								A.mediaEditing = undefined;
							}
						}}
						title="Add media">
						<PlusCircle size="fit-h" />
					</button>
				{/if}
				{#each message.media ?? [] as media}
					<!-- {@const media = A.conversation?.media?.find((m) => m.id === mediaID)} -->
					<div class="carousel-item flex h-24 w-24 items-center justify-center bg-base-300">
						<MessageMediaPreview {media} bind:message />
					</div>
				{/each}
			</div>
			{#if message.uploadOpen && message.editing && message.role === 'user'}
				<div class="bg-base-300 md:mr-16">
					<MediaCarousel bind:message />
				</div>
			{/if}
		</div>
	{/if}

	<div class="relative flex items-start pt-2 text-message" class:bg-base-usermessage={message.role == 'user'}>
		<div class="div items-start px-3 py-3 text-base-content">
			{#if loading}
				<div class="loading loading-ring loading-md"></div>
			{:else if message.role == 'user'}
				<Smile size="24" />
			{:else}
				<details class="dropdown dropdown-right" bind:open={detailsOpen}>
					<summary class="block cursor-pointer text-center">
						<Computer />
					</summary>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="dropdown-content z-40 ml-2" onkeydown={handleKeydown} tabindex="-1">
						<MessageInfo {message} />
					</div>
				</details>
				{#if detailsOpen}
					<button class="fixed inset-0 z-20" onclick={closeDetails} aria-label="Close modal"></button>
				{/if}
			{/if}
		</div>

		<div class="mr-4 flex grow flex-col md:mr-16">
			{#if message.editing && !isPublicPage()}
				<div class="relative my-4 flex w-full flex-col items-start">
					{#if inputFocus && message.role === 'user'}
						{@const currentIndex = A.conversation?.messages?.findIndex((m) => m === message) ?? -1}
						<div class="absolute -top-4 right-2 z-20 text-xs">
							<CostEstimate
								input={message.text}
								messages={A.conversation?.messages?.slice(
									0,
									currentIndex >= 0 ? currentIndex : A.conversation.messages.length
								)} />
						</div>
					{/if}

					{#if inputFocus && A.conversation?.public}
						<div class="absolute -top-4 left-2 z-20 text-xs">
							<span class="text-warning">Conversation is public</span>
						</div>
					{/if}

					<GrowInput
						class="textarea-bordered h-fit min-h-10 w-full"
						placeholder={message.role === 'user' ? 'User message' : 'Start Assistant message'}
						bind:focused={inputFocus}
						bind:value={message.text}
						onkeydown={inputKeyboardHandler}
						{handlePaste}
						autofocus={true}

						/>
					<div class="mt-2 flex w-full items-start justify-start gap-2">
						<button
							class="btn btn-outline btn-sm"
							onclick={async () => {
								message.editing = false;
								await sendEditedMessage();
							}}>
							Save & Send
						</button>
						<button
							class="btn btn-outline btn-sm"
							disabled={savingMessage}
							onclick={async () => {
								savingMessage = true;
								message.markdownCache = undefined;
								await saveMessage();
								savingMessage = false;
								message.editing = false;
							}}>
							{#if savingMessage}
								<div class="loading"></div>
							{:else}
								Save
							{/if}
						</button>
						<button
							class="btn btn-outline btn-sm"
							onclick={() => {
								message.text = message.originalText ?? '';
								message.editing = false;
							}}>
							Cancel
						</button>

						<div class=" ml-auto text-sm">Ctrl/⌘ + Enter ⇒ Save & Send</div>
					</div>
				</div>
			{:else}
				{#if markdown}
					<MarkdownMessage bind:message />
				{:else}
					<div class="w-full whitespace-pre-wrap break-words py-2">{message.text}</div>
				{/if}

				{#if
					A.conversation?.messages?.at(-1) === message &&
					message.role === 'assistant' &&
					message.finishReason !== 'stop' &&
					!isPublicPage() &&
					!A.chatStreaming}
					<button
						class="btn btn-ghost btn-xs absolute bottom-2 right-2 rounded-md p-0 px-1"
						title="Continue generating"
						onclick={submitConversation}
					>
						<StepForward size={15} />
					</button>
				{/if}

			{/if}

			{#if message.finishReason === 'content-filter'}
				<div class="text-warning">Content filtered by the provider</div>
			{:else if message.finishReason == 'error'}
				<div class="text-error">Request finished with an error</div>
			{/if}
			<!-- </div> -->
			<Notification messageType="error" bind:message={chatError} />

			{#if !message.editing}
				<ChatMessageControls bind:message bind:savingMessage bind:markdown bind:chatError {submitConversation} />
			{/if}

			<!-- <pre>{JSON.stringify(message, null, 2)}</pre> -->
		</div>
	</div>
</div>
