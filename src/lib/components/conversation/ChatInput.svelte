<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { A } from '$lib/appstate.svelte';
	import { CostEstimate, GrowInput, MediaCarousel, Notification } from '$lib/components';
	import { handleDataTransfer } from '$lib/utils/media_utils.svelte';
	import { trimLineLength } from '$lib/utils/utils';
	import dbg from 'debug';
	import { ChevronDown, Send, StopCircle, Upload } from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';

	const debug = dbg('app:ui:components:ChatInput');

	let {
		submitConversation,
		cancelConversation
	}: {
		submitConversation: (toDelete?: string[]) => Promise<void>;
		cancelConversation: () => void;
	} = $props();

	let input = $state('');
	let chatError: string | undefined = $state(undefined);

	async function onSubmit() {
		debug('onSubmit', { input, connversation: A.conversation });
		if (!A.conversation) return;

		if (!A.user) {
			await goto('/login');
			return;
		}

		if (!A.conversation.messages) A.conversation.messages = [];

		const previouslyIncludedMedia = new Set(A.conversation.messages.map((m) => m.mediaIDs).flat());
		const newMedia = [];

		for (const media of A.conversation.media ?? []) {
			if (media.active && !previouslyIncludedMedia.has(media.id)) {
				newMedia.push(media);
			}
		}

		if (!input && !newMedia.length) return;

		if (!A.conversation.summary) {
			if (input) {
				A.conversation.summary = trimLineLength(input, 128);
			} else {
				A.conversation.summary = newMedia.map((m) => m.title).join(', ');
			}
		}

		const UM: MessageInterface = { userID: A.conversation.userID, role: 'user', text: input, media: newMedia };
		const AM: MessageInterface = { userID: A.conversation.userID, role: 'assistant', text: prefill };

		A.conversation.messages.push(UM, AM);

		let savedInput = input;
		input = '';
		prefill = '';

		try {
			// This modifies the messages and sets the conversaion id if it was not set.
			await submitConversation();
			chatError = undefined;
			await goto(`/chat/${A.conversation.id}`);
		} catch (e: unknown) {
			debug('onSubmit error', e);
			A.conversation.messages = A.conversation.messages.slice(0, -2);
			if (e instanceof Error) {
				chatError = e.message;
			} else {
				chatError = 'An unknown error occurred';
			}
			input = savedInput;
		}
	}

	async function addMessage(role: 'user' | 'assistant' = 'user') {
		debug('addMessage', { input, connversation: A.conversation });
		if (!input) return;
		if (!A.conversation) return;

		if (!A.user) {
			await goto('/login');
			return;
		}

		if (!A.conversation.summary && !A.conversation.messages?.length)
			A.conversation.summary = trimLineLength(input, 128);

		if (!A.conversation.messages) A.conversation.messages = [];

		const previouslyIncludedMedia = new Set(A.conversation.messages.map((m) => m.mediaIDs).flat());
		const newMedia = [];

		for (const media of A.conversation.media ?? []) {
			if (media.active && !previouslyIncludedMedia.has(media.id)) {
				newMedia.push(media);
			}
		}

		const UM: MessageInterface = { userID: A.conversation.userID, role, text: input, media: newMedia };
		A.conversation.messages.push(UM);

		input = '';
	}

	async function inputKeyboardHandler(event: KeyboardEvent) {
		if (
			!A.chatStreaming &&
			!A.mediaUploading &&
			!A.mediaProcessing &&
			event instanceof KeyboardEvent &&
			event.key === 'Enter'
		) {
			if (A.user?.advancedInput) {
				if (event.ctrlKey && event.shiftKey) {
					event.preventDefault();
					A.conversationUploadOpen = false;
					await addMessage('assistant');
				} else if (event.ctrlKey) {
					event.preventDefault();
					A.conversationUploadOpen = false;
					await onSubmit();
				} else if (event.shiftKey) {
					event.preventDefault();
					await addMessage();
				} else {
					/* nothing to do */
				}
			} else {
				if (!event.shiftKey) {
					event.preventDefault();
					A.conversationUploadOpen = false;
					await onSubmit();
				}
			}
		}
	}

	let lastMessageFromAssistant = $state(false);

	let inputFocus = $state(false);
	let prefillFocus = $state(false);

	let prefillEnabled = $state(false);
	let prefill = $state('');
	let prefillAvailable = $state(false);

	$effect(() => {
		debug('Chatinput Effect');
		if (A.assistants[A.conversation?.assistantID ?? '']?.prefill) prefillAvailable = true;
		else {
			prefillEnabled = false;
			prefillAvailable = false;
		}

		for (const m of A.conversation?.media ?? []) {
			m.active = true;
		}

		if (A.conversation?.messages?.length) {
			for (const msg of A.conversation.messages) {
				if (msg.role === 'user' && msg.mediaIDs?.length) {
					for (const mediaID of msg.mediaIDs) {
						const media = A.conversation.media?.find((m) => m.id === mediaID);
						if (media) {
							media.active = media.repeat;
						}
					}
				}
			}

			if (A.conversation.messages[A.conversation.messages.length - 1].role === 'assistant') {
				lastMessageFromAssistant = true;
			} else {
				lastMessageFromAssistant = false;
			}
		}
	});

	let uploadEnabled = !env.PUBLIC_DISABLE_UPLOADS || env.PUBLIC_DISABLE_UPLOADS !== 'true';

	async function handlePaste(event: ClipboardEvent) {
		debug('handlePaste', event.clipboardData?.items);
		event.preventDefault();
		if (event.clipboardData)
			await handleDataTransfer({
				data: event.clipboardData,
				handle_string: true
			});
	}
</script>

<div class="relative flex h-fit w-full flex-col gap-2">
	<Notification messageType="error" bind:message={chatError} />

	{#if uploadEnabled && (A.conversationUploadOpen || A.conversationDragging)}
		<div
			class="absolute bottom-full flex max-h-[80vh] w-full flex-col overflow-visible bg-base-200"
			transition:slide={{ duration: 200 }}>
			<MediaCarousel />
		</div>
	{/if}

	<div class="grid grid-cols-[min-content,auto] items-center gap-0.5">
		<div
			class="tooltip tooltip-right z-[200]"
			data-tip={prefillAvailable ? null : 'Prefill not available for this assistant'}>
			<button
				aria-label="Prefill Assistant message"
				class="row-span-2 w-6 p-0"
				class:-rotate-90={!prefillEnabled}
				onclick={() => {
					prefillEnabled = !prefillEnabled;
					if (!prefillEnabled) prefill = '';
				}}
				disabled={!prefillAvailable}>
				<ChevronDown />
			</button>
		</div>
		<div class="relative h-full w-full">
			{#if inputFocus || prefillFocus}
				<div transition:fade={{ duration: 100 }}>
					<div class="absolute -top-4 right-2 z-20 text-xs">
						<CostEstimate input={input + prefill} />
					</div>
					{#if A.conversation?.public}
						<div class="absolute -top-4 left-2 z-20 text-xs">
							<span class="text-warning">Conversation is public</span>
						</div>
					{/if}

					{#if !prefillEnabled}
						{#if A.user?.advancedInput}
							<div class="absolute -bottom-4 right-2 z-20 text-xs">
								<span class="text-xs"
									><p>
										Ctrl-Enter - send, Shift-Enter - add without saving, Ctrl-Shift-Enter - add as assistant message
									</p></span>
							</div>
						{:else}
							<div class="absolute -bottom-4 right-2 z-20 text-xs">
								<span class="text-xs"><p>Shift-Enter - add new line</p></span>
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<GrowInput
				bind:focused={inputFocus}
				bind:value={input}
				onkeydown={inputKeyboardHandler}
				{handlePaste}
				disabled={A.chatStreaming}
				placeholder="User message"
				autofocus
				arialabel="Start chatting"
				class="textarea-bordered h-fit max-h-96 w-full whitespace-pre-wrap text-wrap break-all px-12" />
			<div class="absolute bottom-1 left-2">
				<button
					aria-label="Upload media"
					class="btn btn-circle btn-sm relative"
					onclick={() => {
						A.conversationUploadOpen = !A.conversationUploadOpen;
						if (!A.conversationUploadOpen) {
							A.mediaEditing = undefined;
						} else {
							A.conversation?.messages?.forEach((m) => {
								m.uploadOpen = false;
							});
						}
					}}
					disabled={!uploadEnabled || !!A.mediaUploading}>
					<Upload size={20} />
					{#if A.mediaProcessing}
						<span class="loading loading-spinner absolute h-full w-full"></span>
					{/if}
					{#if A.mediaUploading}
						<span class="loading loading-spinner absolute h-full w-full text-success"></span>
					{/if}
				</button>
			</div>
			<div class="absolute bottom-1 right-2">
				{#if A.chatStreaming}
					<div class="relative">
						<button aria-label="Cancel" class="btn btn-sm" onclick={cancelConversation}>
							<div class="relative">
								<StopCircle />
								<span class="absolute inset-0 flex items-center justify-center">
									<span class="loading loading-spinner loading-md"></span>
								</span>
							</div>
						</button>
					</div>
				{:else}
					<button
						class="btn btn-sm rounded-md"
						aria-label="Send"
						onclick={onSubmit}
						disabled={A.chatStreaming || !!A.mediaProcessing || !!A.mediaUploading || !input.trim()}
						class:btn-disabled={A.chatStreaming || A.mediaProcessing || A.mediaUploading || !input.trim()}>
						<Send size={20} />
					</button>
				{/if}
			</div>
		</div>
		{#if prefillEnabled}
			<div class="col-start-2">
				<GrowInput
					bind:focused={prefillFocus}
					bind:value={prefill}
					onkeydown={inputKeyboardHandler}
					disabled={A.chatStreaming}
					placeholder="Start Assistant message"
					arialabel="Prefill Assistant message"
					class="textarea-bordered h-fit max-h-96 w-full whitespace-pre-wrap text-wrap" />
			</div>
		{/if}
	</div>
</div>
