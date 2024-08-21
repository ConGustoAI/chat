<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIupdateUser, APIupsertConversation } from '$lib/api';
	import { assistants, dbUser, hiddenItems } from '$lib/stores/appstate';
	import { loginModal } from '$lib/stores/loginModal';
	import { Info, Star, UserCircle } from 'lucide-svelte';

	export let conversation: ConversationInterface | undefined;
	export let updatingLike: boolean;
	export let chatLoading: boolean;

	async function updateLike(e: Event) {
		if (!conversation || updatingLike || !conversation.id) return;

		updatingLike = true;

		const target = e.target as HTMLInputElement;
		APIupsertConversation({ ...conversation, like: target.checked })
			.then((res) => {
				conversation.like = res.like;
			})
			.catch(() => {
				target.checked = !target.checked;
			});

		updatingLike = false;
	}

	async function setHacker() {
		if (!$dbUser) return;
		try {
			$dbUser = await APIupdateUser({ id: $dbUser.id, hacker: $dbUser.hacker });
		} catch (e) {
			console.error('Failed to update $dbUser', e);
			$dbUser.hacker = !$dbUser.hacker;
		}
	}

	async function TriggerLoginModal() {
		if ($loginModal) {
			($loginModal as HTMLDialogElement).showModal();
		} else {
			goto('/login');
		}
	}

	async function gotoSettings() {
		goto('/settings');
	}

	let editingSummary = false;
</script>

<div class="navbar mx-0 min-h-12 w-full min-w-0 bg-primary-content">
	<div class="navbar-start">
		{#if conversation}
			{#if !conversation.id}
				<select class="select select-bordered select-sm" bind:value={conversation.assistant}>
					{#each Object.entries($assistants) as [id, assistant]}
						{#if !$hiddenItems.has(id) || $dbUser?.assistant === id}
							<option value={id}>{assistant.name}</option>
						{/if}
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
	<!-- navbar-center -->
	<div class="navbar-center max-w-[90%]">
		<div class="w-full text-center text-xl font-bold">
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
					<p class="cursor-pointer truncate" on:dblclick={() => (editingSummary = true)}>
						{conversation.summary ?? 'New chat'}
					</p>
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
				{#if $dbUser?.avatar}
					<div class="p-auto avatar m-auto align-middle">
						<div class="bordered w-6 rounded-xl">
							<!-- https://stackoverflow.com/questions/40570117/http403-forbidden-error-when-trying-to-load-img-src-with-google-profile-pic -->
							<img src={$dbUser.avatar} referrerpolicy="no-referrer" alt="User avatar" />
						</div>
					</div>
				{:else}
					<UserCircle />
				{/if}
			</div>
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<ul tabindex="0" class="menu dropdown-content z-[1] rounded-md bg-primary p-2">
				<button class="btn btn-primary btn-sm justify-start text-nowrap" on:click={gotoSettings}>Settings</button>

				{#if $dbUser}
					<div class="btn btn-primary btn-sm flex flex-nowrap items-center gap-2">
						Hacker
						<input type="checkbox" class="toggle" bind:checked={$dbUser.hacker} on:change={setHacker} />
					</div>
				{/if}

				<button class="btn btn-primary btn-sm justify-start text-nowrap" on:click={() => TriggerLoginModal()}>
					{#if $dbUser}Log out{:else}Log in{/if}
				</button>
			</ul>
		</div>
	</div>
</div>
