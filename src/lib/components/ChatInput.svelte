<script lang="ts">
	import { goto } from '$app/navigation';
	import { Send, StopCircle, Upload } from 'lucide-svelte';
	import GrowInput from './GrowInput.svelte';
	import dbg from 'debug';

	const debug = dbg('app:ui:components:ChatInput');

	export let conversation: ConversationInterface | undefined = undefined;
	export let submitConversation: (toDelete?: string[]) => Promise<void>;

	let input: string;
	let chatLoading: boolean;
	let chatError: string | undefined;

	async function onSubmit() {
		if (!input) return;
		if (!conversation) return;
		if (!conversation.summary) conversation.summary = input;

		conversation.messages = [
			...(conversation.messages ?? []),
			{ userID: conversation.userID, role: 'user', text: input },
			{ userID: conversation.userID, role: 'assistant', text: '' } // TODO: Allow prefill
		];
		chatLoading = true;

		try {
			// This mosifieds the messages and sets the conversaion id if it was not set.
			await submitConversation();
			input = '';
			chatError = undefined;
			goto(`/chat/${conversation.id}`);
			// pushState(`/chat/${conversation.id}`, { replaceState: false });
		} catch (e: unknown) {
			conversation.messages = conversation.messages.slice(0, -2);
			if (e instanceof Error) {
				chatError = e.message;
			} else {
				chatError = 'An unknown error occurred';
			}
		} finally {
			chatLoading = false;
		}
	}

	function inputKeyboardHandler(event: any) {
		if (!chatLoading && event instanceof KeyboardEvent && event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onSubmit();
		}
	}
</script>

<div class="flex w-full flex-col">
	{#if chatError}
		<div class="text-error">{chatError}</div>
	{/if}

	<div class="relative w-full">
		<GrowInput
			bind:value={input}
			on:keydown={inputKeyboardHandler}
			disabled={chatLoading}
			class="textarea-bordered whitespace-pre-wrap text-wrap px-12" />
		<div class="absolute bottom-0.5 left-2">
			<button class="btn btn-circle btn-sm" disabled={true}>
				<Upload style="disabled" />
			</button>
		</div>
		<div class="absolute bottom-0.5 right-2">
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
