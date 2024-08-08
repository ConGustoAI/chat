<script lang="ts">
	import { upsertConversation } from '$lib/api';
	import { Star, Info, Settings } from 'lucide-svelte';
	// import { conversations, assistants, conversation, updatingLike, convId } from '$lib/stores';
	// import { updateLike } from '$lib/utils';

	// $: conversation = conversations[convId];
	export let conversation: ConversationInterface | undefined;
	export let assistants: AssistantInterface[];
	export let updatingLike: boolean;

	async function updateLike(e: Event) {
		if (!conversation || updatingLike || conversation?.id === 'new') return;

		updatingLike = true;

		const target = e.target as HTMLInputElement;
		upsertConversation({ ...conversation, like: target.checked })
			.then((res) => {
				conversation.like = res.like;
			})
			.catch(() => {
				target.checked = !target.checked;
			});

		updatingLike = false;
	}

	let editingSummary = false;
</script>

{#if conversation}
	<div class="navbar min-h-0 bg-primary-content">
		<div class="navbar-start">
			{#if conversation?.id === 'new'}
				<select class="select select-bordered" bind:value={conversation.assistant}>
					{#each assistants as assistant}
						<option value={assistant.id}>{assistant.name}</option>
					{/each}
				</select>
			{:else if updatingLike}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<label class="swap">
					<input type="checkbox" checked={conversation.like} on:change={updateLike} />
					<div class="swap-on"><Star color="yellow" fill="yellow" /></div>
					<div class="swap-off"><Star color="yellow" /></div>
				</label>
			{/if}
		</div>
		<div class="navbar-center">
			<div class="truncate text-center text-xl font-bold">
				{#if editingSummary}
					<input
						type="text"
						class="input input-sm input-bordered w-full"
						bind:value={conversation.summary}
						on:blur={() => (editingSummary = false)}
						on:keypress={(e) => e.key === 'Enter' && (editingSummary = false)} />
				{:else}
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="cursor-pointer" on:dblclick={() => (editingSummary = true)}>
						{conversation.summary ?? 'New chat'}
					</div>
				{/if}
			</div>
		</div>
		<div class="navbar-end gap-2">
			<Info />
			<a href="/settings/">
				<Settings />
			</a>
		</div>
	</div>
{/if}
