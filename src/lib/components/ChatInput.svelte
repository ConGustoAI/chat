<script lang="ts">
	import { type Writable } from 'svelte/store';
	import { readDataStream } from 'ai';
	import { Upload, Send, StopCircle } from 'lucide-svelte';
	import Assistant from './Assistant.svelte';
	import { goto } from '$app/navigation';

	export let message: string;
	export let conversation: ConversationInterface | undefined;
	let chatLoading: boolean;
	let chatError: string | undefined;

	async function submitConversation() {
		if (!conversation || !conversation.assistant) return { error: 'The conversation or assistant is missing.' };
		if (!conversation.messages) return { error: 'The conversation messages are missing.' };
		if (conversation.messages.length < 2) return { error: 'The conversation should have at least 2 messages.' };
		if (conversation.messages[0].role !== 'user') return { error: 'The first message should be from the user.' };
		if (conversation.messages[conversation.messages.length - 1].role !== 'assistant') {
			return { error: 'The last message should be from the assistant.' };
		}

		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ conversation })
		});
		console.log('submitConversation POST:', res);

		if (!res.ok) return { error: (await res.text()) ?? 'Failed to submit the conversation.' };
		if (!res.body) return { error: 'The response body is empty.' };

		const reader = res.body.getReader();
		let responseData: { [key: string]: any } = {};
		for await (const { type, value } of readDataStream(reader)) {
			console.log('readDataStream', type, value);
			if (type === 'text') {
				conversation.messages[conversation.messages.length - 1].text += value;
			}
			if (type === 'finish_message') {
			}
			if (type === 'data') {
				for (const dataPart of value) {
					if (typeof dataPart === 'object' && dataPart !== null) {
						responseData = { ...responseData, ...dataPart };
					}
				}
			}
			if (type === 'error') {
				return { error: value };
			}
		}
		console.log('done chatting, ', { responseData });
		return responseData;
	}

	async function onSubmit() {
		chatLoading = true;
		// Add a 2 second delay
		// await new Promise((resolve) => setTimeout(resolve, 2000));

		if (!message || !conversation) return;
		if (!conversation.summary) conversation.summary = message;

		if (!conversation.messages) conversation.messages = [];
		conversation.messages = [
			...conversation.messages,
			{ role: 'user', text: message, conversationId: conversation.id },
			{ role: 'assistant', text: '', conversationId: conversation.id } // TODO: Allow prefill
		];
		const res = await submitConversation();
		console.log('submitConversation', res);
		chatLoading = false;

		conversation.id = res.conversationId;
		for (let i = 0; i < 2; i++) {
			conversation.messages[conversation.messages.length - 2 + i] = {
				...conversation.messages[conversation.messages.length - 2 + i],
				...res.newMessages[i]
			};
		}
		goto(`/chat/${conversation.id}`);
	}
	// chatLoading = true;
	// chatErrors = [];
	// submitConversation();
	// }
</script>

<div class="w-full bg-base-100 p-4">
	<div class="flex items-center">
		<div class="relative flex-grow">
			<input
				type="text"
				bind:value={message}
				placeholder="Type your message..."
				class="input input-bordered w-full pl-12 pr-12"
				on:keydown={(event) => event.key === 'Enter' && onSubmit()} />
			<div class="absolute left-2 top-1/2 -translate-y-1/2">
				<label for="file-upload" class="btn btn-circle btn-sm">
					<!-- <input id="file-upload" type="file" multiple class="hidden" on:change={uploadFiles} /> -->
					<Upload />
				</label>
			</div>
			<div class="absolute right-2 top-1/2 -translate-y-1/2">
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
</div>
