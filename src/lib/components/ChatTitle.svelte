<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIupdateUser, APIupsertConversation } from '$lib/api';
	import { apiKeys, assistants, dbUser, hiddenItems, models, providers } from '$lib/stores/appstate';
	import { loginModal } from '$lib/stores/loginModal';
	import { ArrowLeftCircle, Info, Link, Star, UserCircle } from 'lucide-svelte';
	import dbg from 'debug';
	import { defaultsUUID } from '$lib/db/schema';
	const debug = dbg('app:ui:conponents:ChatTitle');

	export let conversation: ConversationInterface | undefined;
	export let updatingLike: boolean;
	export let chatLoading: boolean;
	export let isPublic = false;
	let updatingPublic: boolean;

	async function updateConversation(e: Event) {
		if (!conversation || !conversation.id) return;

		const target = e.target as HTMLInputElement;
		const res = await APIupsertConversation(conversation).catch(() => {
			target.checked = !target.checked;
		});

		if (conversation && res) conversation.like = res.like;
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

<div class="navbar mx-0 min-h-12 w-full min-w-0 items-center bg-base-200">
	<div class="navbar-start mr-5 flex w-fit grow-0 gap-4">
		{#if isPublic}
			<a class="link flex w-fit gap-2 text-nowrap" href="/chat">
				<ArrowLeftCircle />Congusto Chat
			</a>
		{/if}

		{#if conversation && !isPublic}
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
					<input
						type="checkbox"
						bind:checked={conversation.like}
						on:change={async (e) => {
							updatingLike = true;
							await updateConversation(e);
							updatingLike = false;
						}} />
					<div class="swap-on"><Star color="var(--star)" fill="var(--star)" /></div>
					<div class="swap-off"><Star color="var(--star)" /></div>
				</label>
			{/if}
			{#if conversation.assistant}
				{@const assistant = $assistants[conversation?.assistant ?? 'empty']}
				{@const model = $models[assistant?.model ?? 'empty']}
				{@const provider = $providers[model?.providerID ?? 'empty']}
				{@const providerKey = Object.entries($apiKeys).find(([id, key]) => key.providerID === provider?.id)}
				{@const assistantKey = Object.entries($apiKeys).find(([id, key]) => key.providerID === assistant.apiKey)}

				{#if assistant}
					{#if !model}
						<div class="flex flex-col text-sm">
							<span class="text-error">Assistant has no model</span>
							<a href="/settings/assistants/#{conversation.assistant}" class="link">Edit assistant</a>
						</div>
					{:else if !providerKey}
						<div class="flex flex-col text-sm">
							<div class="text-error">Provider '{provider?.name}' has no API key</div>
							<a href="/settings/providers/#{provider.id}/keys" class="link">Edit provider</a>
						</div>
					{:else if !assistantKey && assistant.apiKey !== defaultsUUID}
						<div class="flex flex-col text-sm">
							<span class="text-error">Assistant has no API key</span>
							<a href="/settings/assistants/#{conversation.assistant}" class="link">Edit assistant</a>
						</div>
					{/if}
				{/if}
			{/if}
		{/if}
	</div>
	<!-- navbar-center -->
	<div class="navbar-center max-w-[70%]">
		<div class="w-full text-center text-xl font-bold">
			{#if !chatLoading}
				{#if conversation}
					{#if editingSummary}
						<input
							type="text"
							class="input input-sm input-bordered w-full"
							bind:value={conversation.summary}
							on:blur={() => (editingSummary = false)}
							on:keypress={(e) => e.key === 'Enter' && (editingSummary = false)} />
					{:else}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<p
							class="cursor-pointer truncate"
							on:dblclick={() => {
								if (!isPublic) editingSummary = true;
							}}>
							{conversation.summary ?? 'New chat'}
						</p>
					{/if}
				{/if}
			{:else}
				<div class="loading"></div>
			{/if}
		</div>
	</div>

	<div class="navbar-end ml-auto mr-2 gap-2 justify-self-end">
		{#if conversation && !isPublic}
			<div class="mr-5 flex items-center justify-end gap-4">
				{#if conversation.public}
					<a href={'/public/' + conversation.id} class="btn btn-sm rounded-md bg-base-300"><Link size={18} /></a>
				{/if}
				<label for="public" class="text-sm">Share</label>
				{#if updatingPublic}
					<span class="loadin loading loading-spinner"></span>
				{:else}
					<input
						id="public"
						type="checkbox"
						class="checkbox"
						bind:checked={conversation.public}
						on:change={async (e) => {
							updatingPublic = true;
							await updateConversation(e);
							updatingPublic = false;
							if (conversation.public) {
								const url = `${window.location.origin}/public/${conversation.id}`;
								navigator.clipboard.writeText(url);
							}
						}} />
				{/if}
			</div>
		{/if}
		<Info />
		{#if !isPublic}
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
				<ul tabindex="0" class="menu dropdown-content z-[1] bg-base-200 p-2">
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
		{/if}
	</div>
</div>
