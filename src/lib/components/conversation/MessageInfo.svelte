<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { TokenStats } from '$lib/components';

	let { message }: { message: MessageInterface } = $props();
	let provider = $derived(A.providers[A.models[message.model ?? 'unknown']?.providerID ?? 'Unknown']);

	function tokenStatsFromMessage(): TokenStats {
		if (!message) return {};

		const stats: TokenStats = {
			tokensIn: message.tokensIn,
			tokensOut: message.tokensOut,
			tokensInCost: message.tokensInCost,
			tokensOutCost: message.tokensOutCost,
			tokensReasoning: message.tokensReasoning,
			tokensReasoningCost: message.tokensReasoningCost
		};

		return stats;
	}

	let tokenStats = $derived(tokenStatsFromMessage());
</script>

<div class="flex w-max max-w-md flex-col whitespace-pre-line rounded-sm bg-base-300 p-2 lg:max-w-screen-md">
	{#if message.createdAt}
		<div>
			<span><strong>Created at:</strong></span>
			{new Date(message.createdAt).toLocaleString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			})}
		</div>
	{/if}

	<div>
		<span><strong>Assistant:</strong></span>
		{#if message.assistantName}
			{#if A.assistants[message.assistantID ?? 'unknown']}
				<a class="link" href="/settings/assistants/#{message.assistantID}">{message.assistantName}</a>
			{:else}
				{message.assistantName} <span class="text-warning">[Unavailable]</span>
			{/if}
		{:else}
			Unknown
		{/if}
	</div>
	<div>
		<span><strong>Model:</strong></span>
		{#if message.modelName}
			{#if provider}
				<a class="link" href="/settings/providers/#{provider.id}-{message.model}"
					>{provider.name} / {message.modelName}</a>
			{:else}
				{message.modelName} <span class="text-warning">[Unavailable]</span>
			{/if}
		{:else}
			Unknown
		{/if}
	</div>
	<div class="flex gap-2">
		<span><strong>t&deg;:</strong> <code class="bg-base-300 font-mono">{message.temperature}</code></span>
		<span><strong>p:</strong> <code class="bg-base-300 font-mono">{message.topP}</code></span>
		<span><strong>k:</strong> <code class="bg-base-300 font-mono">{message.topK}</code></span>
	</div>

	<TokenStats stats={tokenStats} />

	<div>
		<span><strong>Finish reason:</strong></span>
		{#if message.finishReason === 'content-filter' || message.finishReason === 'aborted'}
			<span class="text-warning">{message.finishReason}</span>
		{:else if message.finishReason == 'error'}
			<span class="text-error">error</span>
		{:else}
			<span class="text-success">{message.finishReason}</span>
		{/if}
	</div>

	<div>
		{#if message.prompt}
			Prompt:
			<pre class="prose w-full whitespace-pre-wrap text-sm">
{message.prompt.text}
</pre>
		{/if}
	</div>
</div>
