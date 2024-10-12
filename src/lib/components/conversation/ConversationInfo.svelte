<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	const debug = dbg('app:ui:components:ConversationInfo');

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
		<h3 class="card-title text-base">Conversation Stats</h3>
		<div class="card-body w-full p-0">
			{#if info.length}
				<div class="flex flex-col">
					<span><strong>Tokens in:</strong> {A.conversation.tokensIn ?? 'N/A'}</span>
					<span><strong>Tokens out:</strong> {A.conversation.tokensOut ?? 'N/A'}</span>
				</div>
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
