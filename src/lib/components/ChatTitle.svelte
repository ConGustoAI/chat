<script lang="ts">
	import { goto } from '$app/navigation';
	import { updateUser, upsertConversation } from '$lib/api';
	import { Star, Info, Settings, UserCircle } from 'lucide-svelte';
	// import { conversations, assistants, conversation, updatingLike, convId } from '$lib/stores';
	// import { updateLike } from '$lib/utils';

	// $: conversation = conversations[convId];
	export let conversation: ConversationInterface | undefined;
	export let assistants: AssistantInterface[];
	export let user: UserInterface | undefined;
	export let updatingLike: boolean;
	export let chatLoading: boolean;

	async function updateLike(e: Event) {
		if (!conversation || updatingLike || !conversation.id) return;

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

	async function setHacker() {
		if (!user) return;
		try {
			user = await updateUser({ id: user.id, hacker: user.hacker });
		} catch (e) {
			console.error('Failed to update user', e);
			user.hacker = !user.hacker;
		}
	}

	async function LogOut() {
		await fetch('/api/logout', { method: 'POST' });
		goto('/login');
	}

	let editingSummary = false;
</script>

<div class="navbar min-h-12 bg-primary-content">
	<div class="navbar-start">
		{#if conversation}
			{#if !conversation.id}
				<select class="select select-bordered select-sm" bind:value={conversation.assistant}>
					{#each assistants as assistant}
						<option value={assistant.id}>{assistant.name}</option>
					{/each}
				</select>
			{:else if updatingLike}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<label class="swap">
					<input type="checkbox" bind:checked={conversation.like} on:change={updateLike} />
					<div class="swap-on"><Star color="yellow" fill="yellow" /></div>
					<div class="swap-off"><Star color="yellow" /></div>
				</label>
			{/if}
		{/if}
	</div>
	<div class="navbar-center">
		<div class="truncate text-center text-xl font-bold">
			{#if conversation && !chatLoading}
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
			{:else}
				<div class="loading"></div>
			{/if}
		</div>
	</div>

	<div class="navbar-end gap-2">
		<Info />
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button">
				<UserCircle />
			</div>
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<ul tabindex="0" class="menu dropdown-content z-[1] rounded-md bg-primary p-2">
				<button class="btn btn-primary btn-sm justify-start text-nowrap" on:click={() => goto('/settings')}
					>Settings</button>

				{#if user}
					<div class="btn btn-primary btn-sm flex flex-nowrap items-center gap-2">
						Hacker
						<input type="checkbox" class="toggle" bind:checked={user.hacker} on:change={setHacker} />
					</div>
				{/if}

				<button class="btn btn-primary btn-sm justify-start text-nowrap" on:click={() => LogOut()}>Log out</button>
			</ul>
		</div>

		<!-- <a href="/settings/">
			<Settings />
		</a> -->
	</div>
</div>
