<script lang="ts">
	import { APIdeleteMessages, APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { addMessage, assert, isPublicPage, updateMessage } from '$lib/utils/utils';
	import dbg from 'debug';
	import { Copy, Edit, Menu, Repeat } from 'lucide-svelte';
	import { DeleteButton, Cost } from '$lib/components';

	const debug = dbg('app:ui:components:ChatMessageControls');

	let {
		message = $bindable(),
		savingMessage = $bindable(),
		markdown = $bindable(),
		submitConversation,
		chatError = $bindable()
	}: {
		message: MessageInterface;
		savingMessage: boolean;
		markdown: boolean;
		submitConversation: () => Promise<void>;
		chatError: string | undefined;
	} = $props();

	async function deleteMessage() {
		debug('deleteMessage', { conversation: A.conversation, message });

		if (!A.conversation || !A.conversation.messages || !A.conversation.messages.length || !message) return;

		const currentIndex = A.conversation.messages?.findIndex((m) => m === message);
		if (currentIndex === -1) return;

		APIupsertMessage({ ...message, deleted: true });
		A.conversation.messages = [
			...A.conversation.messages.slice(0, currentIndex),
			...A.conversation.messages.slice(currentIndex + 1)
		];
	}

	async function reGenerate() {
		debug('reGenerate', { conversation: A.conversation, message });

		if (!A.conversation || !A.conversation.messages || !A.conversation.messages.length || !message) return;

		const currentIndex = A.conversation.messages?.findIndex((m) => m === message);
		if (currentIndex < 1) return;

		// Mark the rest as deleted.
		const toDelete = A.conversation.messages
			.slice(currentIndex)
			.filter((m) => m.id)
			.map((m) => m.id) as string[];
		const deletePromise = APIdeleteMessages(toDelete);

		A.conversation.messages = A.conversation.messages.slice(0, currentIndex);
		A.conversation.messages.push({ userID: A.conversation.userID, role: 'assistant', text: '' });

		try {
			await submitConversation();
		} catch (e) {
			chatError = (e as Error).message ?? 'An unknown error occurred';
		}
		await deletePromise;

		message.editing = false;
	}

	function shouldShowAssistantInfo() {
		// previouis Assistant Message
		let pAM: MessageInterface | undefined;

		for (const m of A.conversation?.messages ?? []) {
			if (m === message) break;
			if (m.role === 'assistant') pAM = m;
		}

		if (
			!pAM ||
			pAM.assistantID !== message.assistantID ||
			pAM.temperature !== message.temperature ||
			pAM.topK !== message.topK ||
			pAM.topP !== message.topP
		)
			return true;
	}
</script>

<div class="absolute right-0 top-0 flex flex-col pr-2">
	<div class="flex w-full items-center justify-end gap-2 text-base-content">
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
		{#if A.dbUser?.showInfo && message.role == 'assistant' && message.id}
			<div class="mr-2 flex gap-4 text-xs text-base-content">
				{#if shouldShowAssistantInfo()}
					<span>
						{#if message.assistantName}
							{message.assistantName}
						{/if}
						{#if message.temperature !== undefined || message.topP !== undefined || message.topK !== undefined}
							{@const stats = [
								message.temperature !== undefined ? `T=${message.temperature}` : undefined,
								message.topP !== undefined ? `P=${message.topP}` : undefined,
								message.topK !== undefined ? `K=${message.topK}` : undefined
							].filter(Boolean)}
							{#if stats.length > 0}
								({stats.join(', ')})
							{/if}
						{/if}
					</span>
				{/if}
				<Cost total={(message.tokensInCost ?? 0) + (message.tokensOutCost ?? 0)} />
			</div>
		{/if}
		<!-- {message.order} -->
		{#if message.role == 'assistant' && !isPublicPage()}
			<button class="btn btn-ghost btn-xs rounded-md p-0 px-1" title="Generate a new response" onclick={reGenerate}
				><Repeat size={15} /></button>
		{/if}
		{#if (message.role !== 'assistant' || !A.dbUser || A.dbUser.hacker) && !isPublicPage()}
			<button
				title="Edit message"
				class="btn btn-ghost btn-xs rounded-md p-0 px-1"
				onclick={() => {
					message.editing = !message.editing;
					if (message.editing) {
						message.originalText = message.text;
					}
				}}><Edit size={15} /></button>
		{/if}
		<button
			title="Copy message to clipboard"
			class="btn btn-ghost btn-xs rounded-md p-0"
			onclick={() => {
				navigator.clipboard.writeText(message.text);
			}}><Copy size={15} /></button>
		{#if !isPublicPage()}
			<DeleteButton
				title="Delete message"
				class="dropdown-end"
				btnClass="btn-xs btn-ghost rounded-md p-1"
				deleteAction={deleteMessage} />
		{/if}
		{#if !A.dbUser || A.dbUser.hacker || isPublicPage()}
			<button
				title="Toggle markdown"
				class="btn btn-ghost btn-outline btn-xs h-5 min-h-4 rounded-md p-0 px-1"
				class:ml-1={markdown}
				onclick={() => {
					markdown = !markdown;
				}}>{markdown ? 'md' : 'raw'}</button>
		{/if}
		{#if !A.dbUser || A.dbUser.hacker && !isPublicPage()}
			<div class="dropdown dropdown-end">
				<button class="btn btn-ghost btn-xs rounded-md p-1" title="More options">
					<Menu size="fit-h" />
				</button>
				<ul class="menu dropdown-content z-20 w-64 text-nowrap bg-base-200 p-2">
					<li>
						<button
							class="btn btn-ghost btn-sm justify-end"
							onclick={async (e: Event) => {
								message.role = message.role === 'assistant' ? 'user' : 'assistant';
								const target = e.target as HTMLButtonElement;
								target.blur();
								savingMessage = true;
								await updateMessage(message);
								savingMessage = false;
							}}>Change role to {message.role === 'assistant' ? 'user' : 'assistant'}</button>
					</li>
					<div class="divider w-full">Add message above</div>
					<li>
						<button
							class="btn btn-ghost btn-sm justify-end"
							onclick={async (e) => {
								const target = e.target as HTMLButtonElement;
								target.blur();
								await addMessage({ parent: message, role: 'assistant', above: true, editing: true });
							}}>assistant</button>
					</li>
					<li>
						<button
							class="btn btn-ghost btn-sm justify-end"
							onclick={async (e) => {
								const target = e.target as HTMLButtonElement;
								target.blur();
								await addMessage({ parent: message, role: 'user', above: true, editing: true });
							}}>user</button>
					</li>
					<div class="divider w-full">Add message below</div>
					<li>
						<button
							class="btn btn-ghost btn-sm justify-end"
							onclick={async (e) => {
								const target = e.target as HTMLButtonElement;
								target.blur();
								await addMessage({ parent: message, role: 'assistant', above: false, editing: true });
							}}>assistant</button>
					</li>
					<li>
						<button
							class="btn btn-ghost btn-sm justify-end"
							onclick={async (e) => {
								const target = e.target as HTMLButtonElement;
								target.blur();
								await addMessage({ parent: message, role: 'user', above: false, editing: true });
							}}>user</button>
					</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
