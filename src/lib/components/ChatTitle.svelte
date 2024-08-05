<script lang="ts">
	import { Star, Info, Settings } from 'lucide-svelte';
	// import { conversations, assistants, conversation, updatingLike, convId } from '$lib/stores';
	// import { updateLike } from '$lib/utils';

	// $: conversation = conversations[convId];
	export let conversation: ConversationInterface | undefined;
	export let assistants: Record<string, AssistantInterface>;
	export let updatingLike: boolean;

	async function updateLike(e: Event) {
		if (!conversation || updatingLike || conversation?.id === 'new') return;

		updatingLike = true;
		const target = e.target as HTMLInputElement;
		const res = await fetch(`/chat/${conversation.id}/update`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ like: target.checked })
		});

		updatingLike = false;

		if (!res.ok) {
			target.checked = !target.checked;
			return;
		}

		conversation.like = target.checked;
	}
</script>

{#if conversation}
	<div class="navbar min-h-0 bg-primary-content">
		<div class="navbar-start">
			{#if conversation?.id === 'new'}
				<select class="select select-bordered" bind:value={conversation.assistant}>
					{#each Object.entries(assistants) as [k, v]}
						<option value={v.id}>{v.name}</option>
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
				{conversation.summary ?? 'New chat'}
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
