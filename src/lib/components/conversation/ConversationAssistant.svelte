<script lang="ts">
	import { defaultsUUID } from '$lib/db/schema';
	import { apiKeys, assistants, conversation, dbUser, hiddenItems, models, providers } from '$lib/stores/appstate';
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
	{/if}
	{#if $conversation.assistant}
		{@const assistant = $assistants[$conversation?.assistant ?? 'empty']}
		{@const model = $models[assistant?.model ?? 'empty']}
		{@const provider = $providers[model?.providerID ?? 'empty']}
		{@const providerKey = Object.entries($apiKeys).find(([id, key]) => key.providerID === provider?.id)}
		{@const assistantKey = Object.entries($apiKeys).find(([id, key]) => key.id === assistant?.apiKey)}

		{#if assistant && $dbUser}
			{#if !model}
				<div class="flex flex-col text-sm">
					<span class="text-error">Assistant has no model</span>
					<a href="/settings/assistants/#{$conversation.assistant}" class="link">Edit assistant</a>
				</div>
			{:else if !providerKey}
				<div class="flex flex-col text-sm">
					<div class="text-error">Provider '{provider?.name}' has no API keys</div>
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
