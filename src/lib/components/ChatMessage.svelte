<script lang="ts">
	import 'highlight.js/styles/github-dark.min.css';
	import 'katex/dist/katex.min.css';
	import { Computer, Copy, Edit, Repeat, Smile } from 'lucide-svelte';

	export let conversation: ConversationInterface | undefined;
	export let submitConversation: (toDelete: string[]) => Promise<void>;
	export let message: MessageInterface;
	export let hacker = false;

	let chatError: string | undefined;
	let markdown: boolean = true;

	import { APIupsertMessage } from '$lib/api';
	import { DeleteButton, GrowInput, MarkdownMessage } from '$lib/components';

	let originalMessage: string;
	let editingMessage = false;

	async function sendEditedMessage() {
		console.log('sendEditedMessage', { conversation, message });
		editingMessage = false;

		if (!conversation || !conversation.messages || !conversation.messages.length || !message) return;

		const currentIndex = conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;

		// Mark the rest as deleted.
		const toDelete = conversation.messages
			.slice(currentIndex + 1)
			.filter((m) => m.id)
			.map((m) => m.id) as string[];

		conversation.messages = conversation.messages.slice(0, currentIndex + 1);
		if (message.role === 'user')
			conversation.messages.push({ userID: conversation.userID, role: 'assistant', text: '' });

		try {
			// Update the conversation
			await submitConversation(toDelete);
		} catch (e) {
			chatError = (e as Error).message ?? 'An unknown error occurred';
		}

		// Reset editing state
		// Add logic here to send the edited message
	}

	async function deleteMessage() {
		console.log('deleteMessage', { conversation, message });

		if (!conversation || !conversation.messages || !conversation.messages.length || !message) return;

		const currentIndex = conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;

		APIupsertMessage({ ...message, deleted: true });
		conversation.messages = [
			...conversation.messages.slice(0, currentIndex),
			...conversation.messages.slice(currentIndex + 1)
		];
	}

	async function reGenerate() {
		console.log('reGenerate', { conversation, message });

		if (!conversation || !conversation.messages || !conversation.messages.length || !message) return;

		const currentIndex = conversation.messages?.findIndex((m) => m === message);
		if (currentIndex < 1) return;

		// Mark the rest as deleted.
		const toDelete = conversation.messages
			.slice(currentIndex)
			.filter((m) => m.id)
			.map((m) => m.id) as string[];

		conversation.messages = conversation.messages.slice(0, currentIndex);
		conversation.messages.push({ userID: conversation.userID, role: 'assistant', text: '' });

		try {
			// Update the conversation
			await submitConversation(toDelete);
		} catch (e) {
			chatError = (e as Error).message ?? 'An unknown error occurred';
		}

		// Reset editing state
		editingMessage = false;
		// Add logic here to send the edited message
	}
</script>

<div class="relative flex items-start" class:bg-secondary-content={message.role == 'user'}>
	<div class="div items-start px-3 py-3">
		{#if message.role == 'user'}
			<Smile size="24" />
		{:else}
			<Computer size="24" />
		{/if}
	</div>
	{#if message.deleted}
		<div class="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-error bg-opacity-50">
			<span class="text-error">This message has been deleted</span>
		</div>
	{/if}
	<div class="mr-16 flex grow flex-col pt-2">
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<!-- <div class=""> -->
		{#if editingMessage}
			<div class="w-full">
				<GrowInput
					maxLines={999}
					bind:value={message.text}
					submit={sendEditedMessage}
					cancel={() => {
						message.text = originalMessage;
						editingMessage = false;
					}} />
			</div>
		{:else if markdown}
			<MarkdownMessage {message} />
		{:else}
			<pre class="whitespace-pre-wrap">{message.text}</pre>
		{/if}
		<!-- </div> -->

		{#if !editingMessage}
			<div class="absolute right-0 top-0 mr-2 flex gap-1">
				<!-- {message.order} -->
				{#if message.role == 'assistant'}
					<button class="btn btn-ghost btn-xs rounded-md p-0 px-1" on:click={reGenerate}><Repeat size={15} /></button>
				{/if}

				{#if message.role !== 'assistant' || hacker}
					<button
						class="btn btn-ghost btn-xs rounded-md p-0 px-1"
						on:click={() => {
							editingMessage = !editingMessage;
							if (editingMessage) {
								originalMessage = message.text;
							}
						}}><Edit size={15} /></button>
				{/if}
				<button
					class="btn btn-ghost btn-xs rounded-md p-0"
					on:click={() => {
						navigator.clipboard.writeText(message.text);
					}}><Copy size={15} /></button>
				<DeleteButton
					class="dropdown-end"
					btnClass="btn-ghost btn-xs rounded-md p-0 px-1"
					deleteAction={deleteMessage}
					size={15} />
				<!-- <button
					class="btn btn-ghost btn-xs rounded-md p-0 px-1"
					on:click={() => {
						deleteMessage();
					}}><Trash2 size={15} /></button> -->
				{#if hacker}
					<button
						class="btn btn-outline btn-xs rounded-md p-0 px-1"
						on:click={() => {
							markdown = !markdown;
						}}>{markdown ? 'md' : 'raw'}</button>
				{/if}
			</div>
		{/if}
		<!-- <pre>{JSON.stringify(message, null, 2)}</pre> -->
	</div>
</div>

{#if chatError}
	<div class="mx-12 text-error">{chatError}</div>
{/if}
