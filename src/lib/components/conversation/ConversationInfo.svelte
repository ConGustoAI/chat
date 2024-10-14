<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	import TokenStats from './TokenStats.svelte';
	const debug = dbg('app:ui:components:ConversationInfo');

	let { isPublic }: { isPublic?: boolean } = $props();

	function collectInfo(): Array<any> {
		if (!A.conversation || !A.conversation.messages) return [];

		const assistantMessages = A.conversation.messages.filter((m) => m.role === 'assistant');
		const infoArray = [];

		for (let i = 0; i < assistantMessages.length; i++) {
			const currentMessage = assistantMessages[i];
			const previousMessage = i > 0 ? assistantMessages[i - 1] : null;

			let changes: { [key: string]: any } = {};

			if (!previousMessage || currentMessage.assistantID !== previousMessage.assistantID) {
				changes.assistant = currentMessage.assistantName || 'N/A';
			}

			if (!previousMessage || currentMessage.modelName !== previousMessage.modelName) {
				changes.model = currentMessage.modelName || 'N/A';
			}

			if (!previousMessage || currentMessage.temperature !== previousMessage.temperature) {
				changes.temperature = currentMessage.temperature?.toFixed(2) || 'N/A';
			}

			if (!previousMessage || currentMessage.topP !== previousMessage.topP) {
				changes.topP = currentMessage.topP?.toFixed(2) || 'N/A';
			}

			if (!previousMessage || currentMessage.topK !== previousMessage.topK) {
				changes.topK = currentMessage.topK || 'N/A';
			}

			if (currentMessage.prompt && (!previousMessage || currentMessage.prompt.text !== previousMessage.prompt?.text)) {
				changes.promptText = currentMessage.prompt.text;
			}

			if (Object.keys(changes).length) {
				infoArray.push(changes);
			}
		}

		debug('collectInfo', { infoArray });
		return infoArray;
	}

	function tokenStatsFromMessages(conversation?: ConversationInterface): TokenStats {
		if (!conversation?.messages) return {};

		const stats: TokenStats = {
			tokensIn: 0,
			tokensOut: 0,
			tokensInCost: 0,
			tokensOutCost: 0,
			tokensReasoning: 0,
			tokensReasoningCost: 0
		};

		for (const message of conversation.messages) {
			stats.tokensIn = (stats.tokensIn ?? 0) + (message.tokensIn ?? 0);
			stats.tokensOut = (stats.tokensOut ?? 0) + (message.tokensOut ?? 0);
			stats.tokensInCost = (stats.tokensInCost ?? 0) + (message.tokensInCost ?? 0);
			stats.tokensOutCost = (stats.tokensOutCost ?? 0) + (message.tokensOutCost ?? 0);
			stats.tokensReasoning = (stats.tokensReasoning ?? 0) + (message.tokensReasoning ?? 0);
			stats.tokensReasoningCost = (stats.tokensReasoningCost ?? 0) + (message.tokensReasoningCost ?? 0);
		}

		return stats;
	}

	let statsFromMessages = $derived(tokenStatsFromMessages(A.conversation));

	function tokenStatsFromConversation(conversation?: ConversationInterface): TokenStats {
		if (!conversation) return {};

		const stats: TokenStats = {
			tokensIn: conversation.tokensIn,
			tokensOut: conversation.tokensOut,
			tokensInCost: conversation.tokensInCost,
			tokensOutCost: conversation.tokensOutCost,
			tokensReasoning: conversation.tokensReasoning,
			tokensReasoningCost: conversation.tokensReasoningCost
		};

		debug('tokenStatsFromConversation', { stats });

		return stats;
	}

	let statsFromConversation = $derived.by(() => tokenStatsFromConversation(A.conversation));

	function compareStats(a: TokenStats, b: TokenStats): boolean {
		return a.tokensIn === b.tokensIn && a.tokensOut === b.tokensOut && a.tokensReasoning === b.tokensReasoning;
	}

	let info = $derived.by(() => {
		const _ = A.conversation; // Trigger dependency

		if (A.conversation?.id && !A.chatStreaming) {
			return collectInfo();
		}
		return [];
	});
</script>

{#if A.conversation?.id}
	<div class="card w-full overflow-auto rounded-none bg-base-300 p-4 shadow-xl">
		<!-- <h3 class="card-title text-base">Conversation Stats</h3> -->
		{#if A.conversation.createdAt}
			<div>
				<span><strong>Created at:</strong></span>
				{new Date(A.conversation.createdAt).toLocaleString('en-GB', {
					day: '2-digit',
					month: 'short',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					hour12: false
				})}
			</div>
		{/if}

		<div class="card-body w-full p-0">
			{#if info.length}
				{#if !compareStats(statsFromMessages, statsFromConversation) && !isPublic}
					<div class="grid grid-cols-[1fr,1fr]">
						<div class="font-bold">Conversatoin tokens</div>
						<div class="font-bold">With deleted messages</div>
						<TokenStats stats={statsFromMessages} />
						<TokenStats stats={statsFromConversation} />
					</div>
				{:else}
					<div class="flex flex-col">
						<strong>Conversation tokens</strong>
						<TokenStats stats={statsFromMessages} />
					</div>
				{/if}

				{#each info as infoItem}
					<div class="mb-2">
						{#each Object.keys(infoItem) as key}
							{#if key === 'promptText'}
								<div class="">
									<strong>{key}:</strong>
									<div class="text-base">{infoItem[key]}</div>
								</div>
							{:else}
								<div class="flex gap-2">
									<strong>{key}:</strong>
									{infoItem[key]}
								</div>
							{/if}
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}
