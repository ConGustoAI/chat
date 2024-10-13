<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { Cost } from '$lib/components';

	let { input = undefined, messages = undefined }: { input?: string; messages?: MessageInterface[] } = $props();

	function estimateTokens(input: string, messages?: MessageInterface[]) {
		let inputTokens = 0;

		if (!messages) messages = A.conversation?.messages;

		const assistant = A.assistants[A.conversation?.assistant ?? 'unknown'];

		// If we had previous messages, the system prompt is counted as part of the first message.
		if (messages && messages.length > 0) {
			inputTokens += messages.reduce((sum, message) => {
				return sum + (message.tokensIn ?? 0) + (message.tokensOut ?? 0);
			}, 0);
			// Otherwise, estimate the number of tokens in the system prompt.
		} else if (assistant) {
			let prompt = '';
			prompt += assistant.systemPrompt ?? '';
			prompt += assistant.aboutUserFromUser ? (A.dbUser?.aboutUser ?? '') : (assistant.aboutUser ?? '');
			prompt += assistant.assistantInstructionsFromUser
				? (A.dbUser?.assistantInstructions ?? '')
				: (assistant.assistantInstructions ?? '');
			inputTokens += prompt.length / 4.5;
		}

		inputTokens += input.length / 4.5; // Assume 4.5 characters per token

		return inputTokens;
	}

	function estimateCost(tokens: number) {
		const assistant = A.assistants[A.conversation?.assistant ?? 'unknown'];
		if (!assistant) return 0;
		const model = A.models[assistant.modelID ?? 'unknown'];
		if (!model) return 0;

		return (tokens * (model.inputCost ?? 0)) / 1000000;
	}

	let tokensEstimate = $derived.by(() => {
		if (A.conversation) {
			return estimateTokens(input ?? '', messages);
		}
	});

	let costEstimate = $derived.by(() => {
		if (A.conversation && tokensEstimate !== undefined) {
			return estimateCost(tokensEstimate);
		}
	});
</script>

{#if A.dbUser?.showEstimate}
	~{tokensEstimate?.toFixed()} tokens <Cost total={costEstimate ?? 0} />
{/if}
