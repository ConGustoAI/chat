<script lang="ts">
	import { conversation, dbUser, assistants, models } from '$lib/stores/appstate';
	import { Cost } from '$lib/components';

	export let input: string | undefined = undefined;
    export let messages: MessageInterface[] | undefined = undefined;


	function estimateTokens(input: string, messages?: MessageInterface[]) {
		let inputTokens = 0;

		if (!messages) messages = $conversation?.messages;

		const assistant = $assistants[$conversation?.assistant ?? 'unknown'];

		// If we had previous messages, the system prompt is counted as part of the first message.
		if (messages && messages.length > 0) {
			inputTokens += messages.reduce((sum, message) => {
				return sum + (message.tokensIn ?? 0) + (message.tokensOut ?? 0);
			}, 0);
			// Otherwise, estimate the number of tokens in the system prompt.
		} else if (assistant) {
			let prompt = '';
			prompt += assistant.systemPrompt ?? '';
			prompt += assistant.aboutUserFromUser ? ($dbUser?.aboutUser ?? '') : (assistant.aboutUser ?? '');
			prompt += assistant.assistantInstructionsFromUser
				? ($dbUser?.assistantInstructions ?? '')
				: (assistant.assistantInstructions ?? '');
			inputTokens += prompt.length / 4.5;
		}

		inputTokens += input.length / 4.5; // Assume 4.5 characters per token

		return inputTokens;
	}

	function estimateCost(tokens: number) {
		const assistant = $assistants[$conversation?.assistant ?? 'unknown'];
		if (!assistant) return 0;
		const model = $models[assistant.model ?? 'unknown'];
		if (!model) return 0;

		return (tokens * (model.inputCost ?? 0)) / 1000000;
	}
	let costEstimate: number | undefined;
	let tokensEstimate: number | undefined;

    $: if ($conversation) {
		tokensEstimate = estimateTokens(input ?? '', messages);
		costEstimate = estimateCost(tokensEstimate);
	}
</script>

{#if $dbUser?.showEstimate}
	~{tokensEstimate?.toFixed()} tokens <Cost total={costEstimate ?? 0} />
{/if}
