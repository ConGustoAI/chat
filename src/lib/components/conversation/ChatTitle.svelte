<script lang="ts">
	import { APIupsertConversation } from '$lib/api';
	import { ConversationAssistant, ConversationInfo, ProfileCircle, ShareConversation, } from '$lib/components';
	import {
		chatDataLoading,
		sidebarOpen,
		conversation
	} from '$lib/stores/appstate';
	import dbg from 'debug';
	import { ArrowLeftCircle, Edit, Info } from 'lucide-svelte';

	const debug = dbg('app:ui:conponents:ChatTitle');

	export let isPublic = false;

	async function updateConversation(e: Event) {
		if (!$conversation || !$conversation.id) return;

		const target = e.target as HTMLInputElement;
		const res = await APIupsertConversation($conversation).catch(() => {
			target.checked = !target.checked;
		});

		if ($conversation && res) $conversation.like = res.like;
	}

	let editingSummary = false;
</script>

<div class="navbar mx-0 min-h-12 w-full min-w-0 items-center bg-base-100">
	<div class="navbar-start mr-5 flex w-fit grow-0 gap-4">
		{#if isPublic}
			<a class="link flex w-fit gap-2 text-nowrap" href="/chat">
				<ArrowLeftCircle />Congusto Chat
			</a>
		{/if}

		{#if $conversation?.id && !$sidebarOpen}
			<a href={'/chat/'} class="link"><Edit /></a>
		{/if}

		{#if !isPublic}
			<ConversationAssistant {updateConversation} />
		{/if}
	</div>
	<!-- navbar-center -->
	<div class="navbar-center hidden max-w-[70%] md:block">
		<div class="w-full text-center text-xl font-bold">
			{#if !$chatDataLoading}
				{#if $conversation}
					{#if editingSummary}
						<input
							type="text"
							class="input input-sm input-bordered w-full"
							bind:value={$conversation.summary}
							on:blur={() => (editingSummary = false)}
							on:keypress={(e) => e.key === 'Enter' && (editingSummary = false)} />
					{:else}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<p
							class="cursor-pointer truncate"
							on:dblclick={() => {
								if (!isPublic) editingSummary = true;
							}}>
							{$conversation.summary ?? 'New chat'}
						</p>
					{/if}
				{/if}
			{:else}
				<div class="loading"></div>
			{/if}
		</div>
	</div>

	<!-- navbar-end -->
	<div class="navbar-end ml-auto mr-2 gap-2 justify-self-end">
		{#if $conversation?.id && !isPublic}
			<ShareConversation {updateConversation} />
		{/if}

		<details class="dropdown-botton dropdown dropdown-end hidden md:block">
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
			<summary class="mt-auto block text-center" tabindex={0}><Info /></summary>
			<div class="dropdown-content z-30 flex max-h-dvh w-max max-w-screen-md whitespace-pre-line p-2 pb-20">
				<ConversationInfo />
			</div>
		</details>

		{#if !isPublic}
			<ProfileCircle />
		{/if}
	</div>
</div>
