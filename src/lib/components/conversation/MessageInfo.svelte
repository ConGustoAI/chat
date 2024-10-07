<script lang="ts">
	import { A } from '$lib/appstate.svelte';

	let { message }: { message: MessageInterface } = $props();
	let provider = $derived(A.providers[A.models[message.model ?? 'unknown']?.providerID ?? 'Unknown']);
</script>

<div class="flex w-max max-w-md flex-col whitespace-pre-line rounded-sm bg-base-300 p-2 lg:max-w-screen-md">
	{#if message.createdAt}
		<div>
			<span>Created at:</span>
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
		<span>Assistant:</span>
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
		<span>Model:</span>
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
		<span>t&deg;: <code class="bg-base-300 font-mono">{message.temperature}</code></span>
		<span>p: <code class="bg-base-300 font-mono">{message.topP}</code></span>
		<span>k: <code class="bg-base-300 font-mono">{message.topK}</code></span>
	</div>
	<div>
		{#if message.tokensIn || message.tokensOut}
			<div>
				<span>
					Tokens: {(message.tokensIn ?? 0) + (message.tokensOut ?? 0)}
				</span>
				{#if (message.tokensInCost ?? 0) + (message.tokensOutCost ?? 0) > 0}
					<span>
						({((message.tokensInCost ?? 0) + (message.tokensOutCost ?? 0)).toFixed(4)}$)
					</span>
				{/if}
			</div>
		{/if}

		{#if message.tokensIn}
			<div class="ml-4">
				<span>
					Tokens in: {message.tokensIn}
				</span>
				{#if message.tokensInCost}
					<span>
						({message.tokensInCost.toFixed(4)}$)
					</span>
				{/if}
			</div>
		{/if}
		{#if message.tokensOut}
			<div class="ml-4">
				<span>
					Tokens out: {message.tokensOut}
				</span>
				{#if message.tokensOutCost}
					<span>
						({message.tokensOutCost.toFixed(4)}$)
					</span>
				{/if}
			</div>
			{#if message.tokensReasoning}
				<div class="ml-8">
					<span>
						Reasoning: {message.tokensReasoning}
					</span>
					{#if message.tokensReasoningCost}
						<span>
							({message.tokensReasoningCost.toFixed(4)}$)
						</span>
					{/if}
				</div>
				<div class="ml-8">
					<span>
						Completion: {message.tokensOut - message.tokensReasoning}
					</span>
					{#if message.tokensOutCost}
						<span>
							({(message.tokensOutCost - (message.tokensReasoningCost ?? 0)).toFixed(4)}$)
						</span>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	<dov>
		<span>Finish reason:</span>
		{#if message.finishReason === 'content-filter' || message.finishReason === 'aborted'}
			<span class="text-warning">{message.finishReason}</span>
		{:else if message.finishReason == 'error'}
			<span class="text-error">error</span>
		{:else}
			<span class="text-success">{message.finishReason}</span>
		{/if}
	</dov>

	<div>
		{#if message.prompt}
			Prompt:
			<pre class="prose w-full whitespace-pre-wrap text-sm">
{message.prompt.text}
</pre>
		{/if}
	</div>
</div>
