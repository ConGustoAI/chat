<script lang="ts">
	import { goto } from '$app/navigation';
	import { Send, StopCircle, Upload } from 'lucide-svelte';
	import GrowInput from '../GrowInput.svelte';
	import dbg from 'debug';
	import { conversation } from '$lib/stores/appstate';

	const debug = dbg('app:ui:components:ChatInput');

	export let submitConversation: (toDelete?: string[]) => Promise<void>;

	let input: string;
	let chatLoading: boolean = false;
	let chatError: string | undefined;

	async function onSubmit() {
		debug('onSubmit', { input, $conversation });
		if (!input) return;
		if (!$conversation) return;
		if (!$conversation.summary) $conversation.summary = input;

		$conversation.messages = [
			...($conversation.messages ?? []),
			{ userID: $conversation.userID, role: 'user', text: input },
			{ userID: $conversation.userID, role: 'assistant', text: '' } // TODO: Allow prefill
		];

		let savedInput = input;
		input = '';

		chatLoading = true;

		try {
			// This modifieds the messages and sets the conversaion id if it was not set.
			await submitConversation();
			input = '';
			chatError = undefined;
			await goto(`/chat/${$conversation.id}`);
		} catch (e: unknown) {
			$conversation.messages = $conversation.messages.slice(0, -2);
			if (e instanceof Error) {
				chatError = e.message;
			} else {
				chatError = 'An unknown error occurred';
			}
			input = savedInput;
		} finally {
			chatLoading = false;
		}
	}

	async function inputKeyboardHandler(event: any) {
		debug('inputKeyboardHandler', { event, chatLoading });
		if (!chatLoading && event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			await onSubmit();
		}
	}
</script>

<div class="flex h-fit w-full flex-col">
	{#if chatError}
		<div class="text-error">{chatError}</div>
	{/if}

	<div class="relative h-fit w-full">
		<GrowInput
			bind:value={input}
			on:keydown={inputKeyboardHandler}
			disabled={chatLoading}
			class="textarea-bordered h-fit max-h-96 whitespace-pre-wrap text-wrap  px-12" />
		<div class="absolute bottom-1 left-2">
			<button class="btn btn-circle btn-sm" disabled={true}>
				<Upload style="disabled" size={20}/>
			</button>
		</div>
		<div class="absolute bottom-1 right-2">
			{#if chatLoading}
				<div class="relative">
					<button class="btn btn-sm">
						<div class="relative">
							<StopCircle />
							<span class="absolute inset-0 flex items-center justify-center">
								<span class="loading loading-spinner loading-md"></span>
							</span>
						</div>
					</button>
				</div>
			{:else}
				<button class="btn btn-sm rounded-md" disabled={chatLoading} on:click={onSubmit}>
					<Send size={20} />
				</button>
			{/if}
		</div>
	</div>
</div>
