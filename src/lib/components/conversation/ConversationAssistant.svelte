<script lang="ts">
	import { defaultsUUID } from '$lib/db/schema';
	import { dbUser, assistants, hiddenItems, models, providers, apiKeys, conversation } from '$lib/stores/appstate';
	import { Star } from 'lucide-svelte';

	export let updateConversation: (e: Event) => Promise<void>;
	let updatingLike = false;
</script>

{#if $conversation}
	{#if !$conversation.id || $dbUser?.hacker}
		<select class="mb:block select select-bordered select-sm" bind:value={$conversation.assistant}>
			<option disabled>Your assistants</option>
			{#each Object.entries($assistants).filter(([id, ass]) => ass.userID !== defaultsUUID) as [id, assistant]}
				{#if !$hiddenItems.has(id) || $dbUser?.assistant === id}
					<option value={id}>{assistant.name}</option>
				{/if}
			{/each}
			<option disabled>Default assistants</option>
			{#each Object.entries($assistants).filter(([id, ass]) => ass.userID === defaultsUUID) as [id, assistant]}
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
				bind:checked={$conversation.like}
				on:change={async (e) => {
					updatingLike = true;
					await updateConversation(e);
					updatingLike = false;
				}} />
			<div class="swap-on"><Star color="var(--star)" fill="var(--star)" /></div>
			<div class="swap-off"><Star color="var(--star)" /></div>
		</label>
	{/if}
	{#if $conversation.assistant}
		{@const assistant = $assistants[$conversation?.assistant ?? 'empty']}
		{@const model = $models[assistant?.model ?? 'empty']}
		{@const provider = $providers[model?.providerID ?? 'empty']}
		{@const providerKey = Object.entries($apiKeys).find(([id, key]) => key.providerID === provider?.id)}
		{@const assistantKey = Object.entries($apiKeys).find(([id, key]) => key.providerID === assistant.apiKey)}

		{#if assistant}
			{#if !model}
				<div class="flex flex-col text-sm">
					<span class="text-error">Assistant has no model</span>
					<a href="/settings/assistants/#{$conversation.assistant}" class="link">Edit assistant</a>
				</div>
			{:else if !providerKey}
				<div class="flex flex-col text-sm">
					<div class="text-error">Provider '{provider?.name}' has no API key</div>
					<a href="/settings/providers/#{provider.id}/keys" class="link">Edit provider</a>
				</div>
			{:else if !assistantKey && assistant.apiKey !== defaultsUUID}
				<div class="flex flex-col text-sm">
					<span class="text-error">Assistant has no API key</span>
					<a href="/settings/assistants/#{$conversation.assistant}" class="link">Edit assistant</a>
				</div>
			{/if}
		{/if}
	{/if}
{/if}
