<script lang="ts">
	import { APIdeleteMessages, APIupsertMessage } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	import Cost from './Cost.svelte';
	import { Copy, Edit, Repeat } from 'lucide-svelte';
	import DeleteButton from '../DeleteButton.svelte';
	const debug = dbg('app:ui:components:ChatMessageControls');

	let {
		message = $bindable(),
		savingMessage = $bindable(),
        editingMessage = $bindable(),
        originalMessage = $bindable(),
        markdown = $bindable(),
		isPublic = false,
		submitConversation,
		chatError = $bindable(),
	}: {
		message: MessageInterface;
		savingMessage: boolean;
        editingMessage: boolean;
        originalMessage: string;
        markdown: boolean;
		isPublic: boolean;
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
			// Update the conversation
			await submitConversation();
		} catch (e) {
			chatError = (e as Error).message ?? 'An unknown error occurred';
		}
		await deletePromise;

		editingMessage = false;
	}
</script>

<div class="absolute right-0 top-0 mr-2 flex w-full items-center justify-end gap-2 text-base-content">
	{#if A.dbUser?.hacker}
		<select
			class="select select-xs m-0 bg-transparent py-0"
			name=""
			id=""
			value={message.role}
			onchange={async (e: Event) => {
				const target = e.target as HTMLSelectElement;
				target.blur();
				debug(e);
				if (target.value != message.role && A.conversation?.id) {
					message.role = target.value as 'user' | 'assistant';
					message.conversationID = A.conversation.id;
					savingMessage = true;
					await APIupsertMessage(message);
					savingMessage = false;
				}
			}}>
			<option class="bg-base-100 text-right" value="user" label="user"></option>
			<option class="bg-base-100 text-right" value="assistant" label="assistant"></option>
		</select>
	{/if}

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
			<Cost total={(message.tokensInCost ?? 0) + (message.tokensOutCost ?? 0)} />
		</div>
	{/if}

	<!-- {message.order} -->
	{#if message.role == 'assistant' && !isPublic}
		<button class="btn btn-ghost btn-xs rounded-md p-0 px-1" onclick={reGenerate}><Repeat size={15} /></button>
	{/if}

	{#if (message.role !== 'assistant' || !A.dbUser || A.dbUser.hacker) && !isPublic}
		<button
			class="btn btn-ghost btn-xs rounded-md p-0 px-1"
			onclick={() => {
				editingMessage = !editingMessage;
				if (editingMessage) {
					originalMessage = message.text;
				}
			}}><Edit size={15} /></button>
	{/if}
	<button
		class="btn btn-ghost btn-xs rounded-md p-0"
		onclick={() => {
			navigator.clipboard.writeText(message.text);
		}}><Copy size={15} /></button>
	{#if !isPublic}
		<DeleteButton
			class="dropdown-end"
			btnClass="btn-xs btn-ghost rounded-md p-1"
			deleteAction={deleteMessage}
			size={15} />
	{/if}
	{#if !A.dbUser || A.dbUser.hacker || isPublic}
		<button
			class="btn btn-ghost btn-outline btn-xs rounded-md p-0 px-1"
			onclick={() => {
				markdown = !markdown;
			}}>{markdown ? 'md' : 'raw'}</button>
	{/if}
</div>
