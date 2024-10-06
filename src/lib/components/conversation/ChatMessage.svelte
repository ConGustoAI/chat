<script lang="ts">
	import { APIupsertMessage } from '$lib/api';
	import { Cost, CostEstimate, DeleteButton, GrowInput, MarkdownMessage, MessageInfo } from '$lib/components';
	import { conversation, dbUser } from '$lib/stores/appstate';
	import 'highlight.js/styles/github-dark.min.css';
	import 'katex/dist/katex.min.css';
	import { Computer, Copy, Edit, Repeat, Smile } from 'lucide-svelte';

	import dbg from 'debug';
	import Notification from '../Notification.svelte';
	const debug = dbg('app:ui:components:ChatMessage');

	export let submitConversation: (toDelete: string[]) => Promise<void>;
	export let message: MessageInterface;
	export let isPublic = false;
	export let loading: boolean = false;

	let chatError: string | undefined;
	$: markdown = message.role === 'assistant';

	let originalMessage: string;
	let editingMessage = false;
	let savingMessage = false;

	let detailsOpen = false;

	let summaryElement: HTMLElement;

	function closeDetails() {
		console.log('closeDetails');
		detailsOpen = false;
		if (summaryElement) summaryElement.blur();
	}

	async function sendEditedMessage() {
		debug('sendEditedMessage', { $conversation, message });

		if (!$conversation || !$conversation.messages || !$conversation.messages.length || !message) return;

		const currentIndex = $conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;
		// Mark the rest as deleted.
		const toDelete = $conversation.messages
			.slice(currentIndex + 1)
			.filter((m) => m.id)
			.map((m) => m.id) as string[];

		$conversation.messages = $conversation.messages.slice(0, currentIndex + 1);
		if (message.role === 'user')
			$conversation.messages.push({ userID: $conversation.userID, role: 'assistant', text: '' });

		try {
			// Update the conversation
			await submitConversation(toDelete);
		} catch (e) {
			chatError = (e as Error).message ?? 'An unknown error occurred';
		}
	}

	async function updateMessage() {
		debug('updateMessage', { $conversation, message });

		if (!$conversation || !$conversation.messages || !$conversation.messages.length || !message) return;

		savingMessage = true;
		const currentIndex = $conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;

		await APIupsertMessage(message);
		savingMessage = false;
	}

	async function deleteMessage() {
		debug('deleteMessage', { conversation, message });

		if (!$conversation || !$conversation.messages || !$conversation.messages.length || !message) return;

		const currentIndex = $conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;

		APIupsertMessage({ ...message, deleted: true });
		$conversation.messages = [
			...$conversation.messages.slice(0, currentIndex),
			...$conversation.messages.slice(currentIndex + 1)
		];
	}

	async function reGenerate() {
		debug('reGenerate', { $conversation, message });

		if (!$conversation || !$conversation.messages || !$conversation.messages.length || !message) return;

		const currentIndex = $conversation.messages?.findIndex((m) => m === message);
		if (currentIndex < 1) return;

		// Mark the rest as deleted.
		const toDelete = $conversation.messages
			.slice(currentIndex)
			.filter((m) => m.id)
			.map((m) => m.id) as string[];

		$conversation.messages = $conversation.messages.slice(0, currentIndex);
		$conversation.messages.push({ userID: $conversation.userID, role: 'assistant', text: '' });

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
				message.markdownCache = undefined;
				editingMessage = false;
				await sendEditedMessage();
			} else if (event.key === 'Escape') {
				message.text = originalMessage;
				editingMessage = false;
			}
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDetails();
		}
	}

	let inputFocus = false;
</script>

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
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="dropdown-content z-40 ml-2" on:keydown={handleKeydown} tabindex="-1">
					<MessageInfo {message} />
				</div>
			</details>
			{#if detailsOpen}
				<button class="fixed inset-0 z-20" on:click|self={closeDetails}></button>
			{/if}
		{/if}
	</div>

	<div class="mr-4 flex grow flex-col md:mr-16">
		{#if editingMessage && !isPublic}
			<div class="relative my-4 flex w-full flex-col items-start">
				{#if inputFocus && message.role === 'user'}
					{@const currentIndex = $conversation?.messages?.findIndex((m) => m === message) ?? -1}
					<div class="absolute -top-4 right-2 z-20 text-xs">
						<CostEstimate
							input={message.text}
							messages={$conversation?.messages?.slice(
								0,
								currentIndex >= 0 ? currentIndex : $conversation.messages.length
							)} />
					</div>
				{/if}

				{#if inputFocus && $conversation?.public}
					<div class="absolute -top-4 left-2 z-20 text-xs">
						<span class="text-warning">Conversation is public</span>
					</div>
				{/if}

				<GrowInput
					class="textarea-bordered w-full"
					bind:focused={inputFocus}
					bind:value={message.text}
					on:keydown={inputKeyboardHandler} />
				<div class="mt-2 flex w-full items-start justify-start gap-2">
					<button
						class="btn btn-outline btn-sm"
						on:click={async () => {
							editingMessage = false;
							await sendEditedMessage();
						}}>
						Save & Send
					</button>
					<button
						class="btn btn-outline btn-sm"
						disabled={savingMessage}
						on:click={async () => {
							savingMessage = true;
							message.markdownCache = undefined;
							await updateMessage();
							savingMessage = false;
							editingMessage = false;
						}}>
						{#if savingMessage}
							<div class="loading"></div>
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
			<div class="w-full whitespace-pre-wrap break-words py-2">{message.text}</div>
		{/if}

		{#if message.finishReason === 'content-filter'}
			<div class="text-warning">Content filtered by the provider</div>
		{:else if message.finishReason == 'error'}
			<div class="text-error">Request finished with an error</div>
		{/if}
		<!-- </div> -->
		<Notification messageType="error" bind:message={chatError} />

		{#if !editingMessage}
			<div class="absolute right-0 top-0 mr-2 flex w-fit items-center gap-2 text-base-content">
				{#if message.createdAt && message.role !== 'assistant'}
					{new Date(message.createdAt).toLocaleString('en-GB', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: false
					})}
				{/if}
				{#if $dbUser?.showInfo && message.role == 'assistant' && message.id}
					<div class="mr-2 flex gap-4 text-xs text-base-content">
						<span>{message.assistantName} (T={message.temperature}, P={message.topP}, K={message.topK}) </span>
						<Cost total={(message.tokensInCost ?? 0) + (message.tokensOutCost ?? 0)} />
					</div>
				{/if}

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
