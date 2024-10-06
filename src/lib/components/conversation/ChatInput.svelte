<script lang="ts">
	import { goto } from '$app/navigation';
	import { CostEstimate, GrowInput, Notification, MediaCarousel } from '$lib/components';
	import { chatStreaming, conversation } from '$lib/stores/appstate';
	import { trimLineLength } from '$lib/utils';
	import dbg from 'debug';

	import { Send, StopCircle, Upload } from 'lucide-svelte';

	const debug = dbg('app:ui:components:ChatInput');

	export let submitConversation: (toDelete?: string[]) => Promise<void>;
	export let cancelConversation: () => void;

	let input: string;
	let chatError: string | undefined;
	let uploadOpen: boolean = true;

	async function onSubmit() {
		debug('onSubmit', { input, $conversation });
		if (!input) return;
		if (!$conversation) return;
		if (!$conversation.summary) $conversation.summary = trimLineLength(input, 128);

		$conversation.messages = [
			...($conversation.messages ?? []),
			{ userID: $conversation.userID, role: 'user', text: input },
			{ userID: $conversation.userID, role: 'assistant', text: '' } // TODO: Allow prefill
		];

		let savedInput = input;
		input = '';

		try {
			// This modifieds the messages and sets the conversaion id if it was not set.
			await submitConversation();
			input = '';
			chatError = undefined;
			await goto(`/chat/${$conversation.id}`);
		} catch (e: unknown) {
			debug('onSubmit error', e);
			$conversation.messages = $conversation.messages.slice(0, -2);
			if (e instanceof Error) {
				chatError = e.message;
			} else {
				chatError = 'An unknown error occurred';
			}
			input = savedInput;
		}
	}

	async function inputKeyboardHandler(event: any) {
		if (!$chatStreaming && event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			await onSubmit();
		}
	}

	let inputFocus = false;
</script>

<div class="relative flex h-fit w-full flex-col">
	<Notification messageType="error" bind:message={chatError} />
	{#if uploadOpen}
		<div class="absolute bottom-8 mb-4 flex max-h-[80vh] w-full flex-col bg-base-200">
			<MediaCarousel />
		</div>
	{/if}
	<div class="relative h-fit w-full">
		{#if inputFocus}
			<div class="absolute -top-4 right-2 z-20 text-xs">
				<CostEstimate {input} />
			</div>
			{#if $conversation?.public}
				<div class="absolute -top-4 left-2 z-20 text-xs">
					<span class="text-warning">Conversation is public</span>
				</div>
			{/if}
		{/if}
		<GrowInput
			bind:focused={inputFocus}
			bind:value={input}
			on:keydown={inputKeyboardHandler}
			disabled={$chatStreaming}
			class="textarea-bordered h-fit max-h-96 whitespace-pre-wrap text-wrap  px-12" />
		<div class="absolute bottom-1 left-2">
			<button class="btn btn-circle btn-sm" on:click={() => (uploadOpen = !uploadOpen)}>
				<Upload style="disabled" size={20} />
			</button>
		</div>
		<div class="absolute bottom-1 right-2">
			{#if $chatStreaming}
				<div class="relative">
					<button class="btn btn-sm" on:click={cancelConversation}>
						<div class="relative">
							<StopCircle />
							<span class="absolute inset-0 flex items-center justify-center">
								<span class="loading loading-spinner loading-md"></span>
							</span>
						</div>
					</button>
				</div>
			{:else}
				<button class="btn btn-sm rounded-md" disabled={$chatStreaming} on:click={onSubmit}>
					<Send size={20} />
				</button>
			{/if}
		</div>
	</div>
</div>
