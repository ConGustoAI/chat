<script lang="ts">
	import { goto } from '$app/navigation';
	import { Send, StopCircle, Upload } from 'lucide-svelte';
	import GrowInput from './GrowInput.svelte';

	export let conversation: ConversationInterface | undefined;
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
			{ role: 'user', text: input },
			{ role: 'assistant', text: '' } // TODO: Allow prefill
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
</script>

<div class="flex w-full flex-col">
	{#if chatError}
		<div class="text-error">{chatError}</div>
	{/if}

	<div class="relative w-full">
		<GrowInput bind:value={input} submit={onSubmit} class="px-12" />
		<div class="absolute bottom-3 left-2">
			<label for="file-upload" class="btn btn-circle btn-sm">
				<Upload style="disabled" />
			</label>
		</div>
		<div class="absolute bottom-3 right-2">
			{#if chatLoading}
				<div class="relative">
					<div class="loading absolute inset-0 flex items-center justify-center">
						<span class="loading loading-spinner loading-md"></span>
					</div>
					<button class="btn btn-sm">
						<StopCircle />
					</button>
				</div>
			{:else}
				<button class="btn btn-sm rounded-md" on:click={onSubmit}>
					<Send size={20} />
				</button>
			{/if}
		</div>
	</div>
</div>
