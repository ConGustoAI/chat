<script lang="ts">
	let { stats }: { stats: TokenStatsInterface } = $props();
	let { tokensIn, tokensOut, tokensInCost, tokensOutCost, tokensReasoning, tokensReasoningCost } = $derived(stats);
</script>

<div>
	{#if tokensIn || tokensOut}
		<div>
			<span>
				<strong>Total:</strong>
				{(tokensIn ?? 0) + (tokensOut ?? 0)}
			</span>
			{#if (tokensInCost ?? 0) + (tokensOutCost ?? 0) > 0}
				<span>
					({((tokensInCost ?? 0) + (tokensOutCost ?? 0)).toFixed(4)}$)
				</span>
			{/if}
		</div>
	{/if}

	{#if tokensIn}
		<div class="ml-4">
			<span>
				<strong>In:</strong>
				{tokensIn}
			</span>
			{#if tokensInCost}
				<span>
					({tokensInCost.toFixed(4)}$)
				</span>
			{/if}
		</div>
	{/if}
	{#if tokensOut}
		<div class="ml-4">
			<span>
				<strong>Out:</strong>
				{tokensOut}
			</span>
			{#if tokensOutCost}
				<span>
					({tokensOutCost.toFixed(4)}$)
				</span>
			{/if}
		</div>
		{#if tokensReasoning}
			<div class="ml-8">
				<span>
					<strong>Reasoning:</strong>
					{tokensReasoning}
				</span>
				{#if tokensReasoningCost}
					<span>
						({tokensReasoningCost.toFixed(4)}$)
					</span>
				{/if}
			</div>
			<div class="ml-8">
				<span>
					<strong>Completion:</strong>
					{tokensOut - tokensReasoning}
				</span>
				{#if tokensOutCost}
					<span>
						({(tokensOutCost - (tokensReasoningCost ?? 0)).toFixed(4)}$)
					</span>
				{/if}
			</div>
		{/if}
	{/if}
</div>
