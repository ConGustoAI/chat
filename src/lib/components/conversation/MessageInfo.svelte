<script lang="ts">
	import { assistants, providers, models } from '$lib/stores/appstate';

	export let message: MessageInterface;
	$: provider = $providers[$models[message.model ?? 'unknown']?.providerID ?? 'Unknown'];
</script>

<div class="flex w-max max-w-md flex-col whitespace-pre-line rounded-sm bg-base-300 p-2 lg:max-w-screen-md">
	<div>
		<span>Assistant:</span>
		{#if message.assistantName}
			{#if $assistants[message.assistantID ?? 'unknown']}
				<a class="link" href="/settings/assistants/#{message.assistantID}">{message.assistantName}</a>
			{:else}
				{message.assistantName} <span class="text-warning">[Deleted]</span>
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
				{message.modelName} <span class="text-warning">[Unknown provider]</span>
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
				<span
					>Tokens: ({message.tokensIn ?? 0} / {message.tokensOut ?? 0} / {(message.tokensIn ?? 0) +
						(message.tokensOut ?? 0)})</span>
				{#if (message.tokensInCost ?? 0) + (message.tokensOutCost ?? 0) > 0}
					<span>
						=&gt; ({message.tokensInCost ?? 0} / {message.tokensOutCost ?? 0} / {(message.tokensInCost ?? 0) +
							(message.tokensOutCost ?? 0)})$</span>
				{/if}
			</div>
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
