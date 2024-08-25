<script lang="ts">
	import 'highlight.js/styles/github-dark.min.css';
	import 'katex/dist/katex.min.css';
	import { Computer, Copy, Edit, Repeat, Smile } from 'lucide-svelte';
	import { dbUser } from '$lib/stores/appstate';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:ChatMessage');

	export let conversation: ConversationInterface | undefined;
	export let submitConversation: (toDelete: string[]) => Promise<void>;
	export let message: MessageInterface;
	export let isPublic = false;

	let chatError: string | undefined;
	let markdown: boolean = true;

	import { APIupsertMessage } from '$lib/api';
	import { DeleteButton, GrowInput, MarkdownMessage } from '$lib/components';

	let originalMessage: string;
	let editingMessage = false;
	let savingMessage = false;

	async function sendEditedMessage() {
		debug('sendEditedMessage', { conversation, message });
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
	}

	async function updateMessage() {
		debug('updateMessage', { conversation, message });

		if (!conversation || !conversation.messages || !conversation.messages.length || !message) return;

		savingMessage = true;
		const currentIndex = conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;

		await APIupsertMessage(message);
		savingMessage = false;
	}

	async function deleteMessage() {
		debug('deleteMessage', { conversation, message });

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
		debug('reGenerate', { conversation, message });

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

		editingMessage = false;
	}

	async function inputKeyboardHandler(event: any) {
		if (editingMessage && conversation && event instanceof KeyboardEvent) {
			if (event.key === 'Enter' && event.ctrlKey) {
				event.preventDefault();
				await sendEditedMessage();
			} else if (event.key === 'Escape') {
				message.text = originalMessage;
				editingMessage = false;
			}
		}
	}
</script>

<div class="text-message relative flex items-start" class:bg-base-usermessage={message.role == 'user'}>
	<div class="div items-start px-3 py-3 text-base-content">
		{#if message.role == 'user'}
			<Smile size="24" />
		{:else}
			<Computer size="24" />
		{/if}
	</div>
	<div class="mr-16 flex grow flex-col pt-2">
		{#if editingMessage && !isPublic}
			<div class="my-4 flex w-full flex-col items-start">
				<GrowInput bind:value={message.text} on:keydown={inputKeyboardHandler} />
				<div class="mt-2 flex w-full items-start justify-start gap-2">
					<button class="btn btn-outline btn-sm" on:click={sendEditedMessage}> Save & Send </button>
					<button
						class="btn btn-outline btn-sm"
						disabled={savingMessage}
						on:click={async () => {
							savingMessage = true;
							await updateMessage();
							savingMessage = false;
							editingMessage = false;
						}}>
						{#if savingMessage}
							<div class="loading" />
						{:else}
							Save
						{/if}
					</button>
					<button
						class="btn btn-outline btn-sm"
						on:click={() => {
							message.text = originalMessage;
							editingMessage = false;
						}}>
						Cancel
					</button>

					<div class=" ml-auto text-sm">Ctrl/⌘ + Enter ⇒ Save & Send</div>
				</div>
			</div>
		{:else if markdown}
			<MarkdownMessage {message} />
		{:else}
			<pre class="whitespace-pre-wrap">{message.text}</pre>
		{/if}
		<!-- </div> -->

		{#if !editingMessage}
			<div class="absolute right-0 top-2 mr-2 flex gap-2 text-base-content">
				<!-- {message.order} -->
				{#if message.role == 'assistant' && !isPublic}
					<button class="btn btn-ghost btn-xs rounded-md p-0 px-1" on:click={reGenerate}><Repeat size={15} /></button>
				{/if}

				{#if (message.role !== 'assistant' || !$dbUser || $dbUser.hacker) && !isPublic}
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
				{#if !isPublic}
					<DeleteButton
						class="dropdown-end"
						btnClass="btn-xs btn-ghost rounded-md p-1"
						deleteAction={deleteMessage}
						size={15} />
				{/if}
				{#if !$dbUser || $dbUser.hacker || isPublic}
					<button
						class="btn btn-ghost btn-outline btn-xs rounded-md p-0 px-1"
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
