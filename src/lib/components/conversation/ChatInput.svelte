<script lang="ts">
	import { goto } from '$app/navigation';
	import { CostEstimate, GrowInput, Notification, MediaCarousel } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { trimLineLength } from '$lib/utils/utils';
	import dbg from 'debug';
	import { Send, StopCircle, Upload, ChevronDown } from 'lucide-svelte';
	import { env } from '$env/dynamic/public';
	import { uploadConversationMedia } from '$lib/utils/media_utils.svelte';

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
		if (!input) return;
		if (!A.conversation) return;
		if (!A.conversation.summary) A.conversation.summary = trimLineLength(input, 128);

		if (!A.conversation.messages) A.conversation.messages = [];

		const UM: MessageInterface = { userID: A.conversation.userID, role: 'user', text: input };
		const AM: MessageInterface = { userID: A.conversation.userID, role: 'assistant', text: prefill };

		A.conversation.messages.push(UM, AM);

		await uploadConversationMedia();

		const previouslyIncludedMedia = new Set(A.conversation.messages.map((m) => m.mediaIDs).flat());

		const mediaIDs = [];
		for (const media of A.conversation.media ?? []) {
			if (media.active && !previouslyIncludedMedia.has(media.id) ) mediaIDs.push(media.id!);
		}

		A.conversation.messages[A.conversation.messages.length - 2].mediaIDs = mediaIDs;

		// A.conversation.messages.push(
		// 	{ userID: A.conversation.userID, role: 'user', text: input, mediaIDs },
		// 	{ userID: A.conversation.userID, role: 'assistant', text: prefill } // TODO: Allow prefill
		// );

		debug('onSubmit after pushing messages: ', $state.snapshot(A.conversation));

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

	async function inputKeyboardHandler(event: any) {
		if (
			!A.chatStreaming &&
			!A.mediaUploading &&
			!A.mediaProcessing &&
			event instanceof KeyboardEvent &&
			event.key === 'Enter' &&
			!event.shiftKey
		) {
			event.preventDefault();
			uploadOpen = false;
			await onSubmit();
		}
	}

	let inputFocus = $state(false);
	let prefillFocus = $state(false);

	let prefillEnabled = $state(false);
	let prefill = $state('');
	let prefillAvailable = $state(false);

	$effect(() => {
		debug('Chatinput Effect');
		if (A.assistants[A.conversation?.assistant ?? '']?.prefill) prefillAvailable = true;
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
		}
	});

	let uploadOpen: boolean = $state(false);
	let uploadEnabled = !env.PUBLIC_DISABLE_UPLOADS || env.PUBLIC_DISABLE_UPLOADS !== 'true';
</script>

<div class="relative flex h-fit w-full flex-col gap-2">
	<Notification messageType="error" bind:message={chatError} />

	{#if uploadEnabled}
		<div
			class="absolute bottom-full flex max-h-[80vh] w-full flex-col overflow-visible bg-base-200"
			tabindex="-1"
			class:invisible={!uploadOpen}>
			<MediaCarousel />
		</div>
	{/if}

	<div class="grid grid-cols-[min-content,auto] items-center gap-0.5">
		<div
			class="tooltip tooltip-right z-[200]"
			data-tip={prefillAvailable ? null : 'Prefill not available for this assistant'}>
			<button
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
				<div class="absolute -top-4 right-2 z-20 text-xs">
					<CostEstimate input={input + prefill} />
				</div>
				{#if A.conversation?.public}
					<div class="absolute -top-4 left-2 z-20 text-xs">
						<span class="text-warning">Conversation is public</span>
					</div>
				{/if}
			{/if}
			<!-- {#if !uploadOpen && !A.conversation?.media?.length}

			{/if} -->
			<GrowInput
				bind:focused={inputFocus}
				bind:value={input}
				onkeydown={inputKeyboardHandler}
				disabled={A.chatStreaming}
				placeholder="User message"
				class="textarea-bordered h-fit max-h-96 w-full whitespace-pre-wrap text-wrap px-12" />
			<div class="absolute bottom-1 left-2">
				<button
					class="btn btn-circle btn-sm relative"
					onclick={() => (uploadOpen = !uploadOpen)}
					disabled={!uploadEnabled || A.mediaUploading}>
					<Upload size={20} />
					{#if A.mediaUploading || A.mediaProcessing}
						<span class="loading loading-spinner absolute h-full w-full"></span>
					{/if}
				</button>
			</div>
			<div class="absolute bottom-1 right-2">
				{#if A.chatStreaming}
					<div class="relative">
						<button class="btn btn-sm" onclick={cancelConversation}>
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
						onclick={onSubmit}
						disabled={A.chatStreaming || A.mediaProcessing || A.mediaUploading || !input.trim()}
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
					class="textarea-bordered h-fit max-h-96 w-full whitespace-pre-wrap text-wrap" />
			</div>
		{/if}
	</div>
</div>
