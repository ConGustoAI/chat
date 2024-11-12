<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { TokenStats } from '$lib/components';
	import { assert, isPublicPage } from '$lib/utils/utils';

	import { JsonView } from '@zerodevx/svelte-json-view';

	import dbg from 'debug';
	import { Copy, Download } from 'lucide-svelte';
	const debug = dbg('app:ui:components:conversation:MessageInfo');

	let { message }: { message: MessageInterface } = $props();
	let provider = $derived(A.providers[A.models[message.modelID ?? 'unknown']?.providerID ?? 'Unknown']);

	function tokenStatsFromMessage(): TokenStatsInterface {
		if (!message) return {};

		const stats: TokenStatsInterface = {
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

	function handleKeydownSelectAll(event: KeyboardEvent) {
		debug('handleKeydownSelectAll', event);
		if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
			event.preventDefault();
			event.stopPropagation();
			const range = document.createRange();
			range.selectNodeContents(event.target as HTMLElement);
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	}

	function handleCopyToClipboard(data: string) {
		const content = JSON.parse(data);
		navigator.clipboard.writeText(JSON.stringify(content, null, 2));
	}

	function handleDownloadAsJson(data: string, filename: string) {
		const content = JSON.parse(data);
		const blob = new Blob([JSON.stringify(content, null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	let messagesSentDropdown: HTMLInputElement | undefined = $state();
	let resultDropdown: HTMLInputElement | undefined = $state();
</script>

<div class="flex w-max max-w-md flex-col rounded-sm bg-base-300 p-2 lg:max-w-screen-md">
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
				{message.assistantName}
			{/if}
		{:else}
			Unknown
		{/if}
	</div>
	<div>
		<span><strong>Model:</strong></span>
		{#if message.modelName}
			{#if provider}
				<a class="link" href="/settings/providers/#{provider.id}-{message.modelID}"
					>{provider.name} / {message.modelName}</a>
			{:else}
				{message.modelName}
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
			<strong>Prompt:</strong>
			<pre class="prose w-full whitespace-pre-wrap text-sm">
{message.prompt.text}
</pre>
		{/if}
	</div>
	<div class="wrap flex w-full flex-col gap-2 break-words">
		{#if message.messagesSent && (A.user?.hacker || isPublicPage())}
			<div class="collapse rounded-none bg-base-200 p-0">
				<input bind:this={messagesSentDropdown} type="checkbox" class="peer min-h-0" />
				<div class="collapse-title min-h-0 bg-base-200 p-2 text-primary-content peer-checked:bg-base-100">
					<div class="flex justify-end gap-2">
						<strong class="mr-auto self-start">Sent</strong>
						<button
							aria-label="Copy to clipboard"
							class="btn btn-ghost z-50 size-5 min-h-fit rounded-md p-0"
							title="Copy to clipboard"
							onclick={() => {
								assert(message.messagesSent);
								handleCopyToClipboard(message.messagesSent);
							}}>
							<Copy />
						</button>

						<button
							aria-label="Download as JSON"
							class="btn btn-ghost z-50 size-5 min-h-fit rounded-md p-0"
							title="Download as JSON"
							onclick={() => {
								assert(message.messagesSent);
								handleDownloadAsJson(message.messagesSent, `message-${message.id}.json`);
							}}>
							<Download />
						</button>
					</div>
				</div>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="collapse-content break-all bg-primary text-primary-content"
					onkeydown={handleKeydownSelectAll}
					tabindex="-1">
					<JsonView json={JSON.parse(message.messagesSent)} depth={3} />
				</div>
			</div>
		{/if}

		{#if message.result && (A.user?.hacker || isPublicPage()) }
			<div class="collapse rounded-none bg-base-200">
				<input bind:this={resultDropdown} type="checkbox" class="peer min-h-0" />
				<div class="collapse-title min-h-0 bg-base-200 p-2 text-primary-content peer-checked:bg-base-100">
					<div class="flex justify-end gap-2">
						<strong class="mr-auto self-start">Received</strong>
						<button
							aria-label="Copy to clipboard"
							class="btn btn-ghost z-50 size-5 min-h-fit rounded-md p-0"
							title="Copy to clipboard"
							onclick={() => {
								assert(message.result);
								handleCopyToClipboard(message.result);
							}}>
							<Copy />
						</button>

						<button
							aria-label="Download as JSON"
							class="btn btn-ghost z-50 size-5 min-h-fit rounded-md p-0"
							title="Download as JSON"
							onclick={() => {
								assert(message.result);
								handleDownloadAsJson(message.result, `result-${message.id}.json`);
							}}>
							<Download />
						</button>
					</div>
				</div>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="collapse-content break-all bg-primary text-primary-content"
					onkeydown={handleKeydownSelectAll}
					tabindex="-1">
					<JsonView json={JSON.parse(message.result)} depth={2} />
				</div>
			</div>
		{/if}
	</div>
</div>
