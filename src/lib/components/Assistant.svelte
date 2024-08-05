<script lang="ts">
	import { Trash2 } from 'lucide-svelte';

	export let assistant: AssistantInterface;
	export let providers: ProviderAssistantInterface[];
	export let aboutUser: string | null;
	export let instructions: string | null;
	export let deleteAssistant;

	function findProviderModel(p: typeof providers, modelID?: string | null) {
		if (!modelID) return null;
		for (let provider of p) {
			for (let model of provider.models) {
				if (model.id === modelID) {
					return { provider, model };
				}
			}
		}
	}

	$: selected = findProviderModel(providers, assistant.model);
</script>

<div class="bg-sec card rounded-sm shadow-xl">
	<div class="card-body p-3">
		<div class="div flex gap-2">
			<h2 class="card-title">{assistant.name}</h2>
		</div>

		<div
			class="grid grid-cols-[15rem,min-content,min-content,min-content,min-content,auto,min-content] items-end gap-2">
			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">Name</span>
				</div>
				<input type="text" class="input input-bordered" bind:value={assistant.name} />
			</div>
			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">Model</span>
				</div>
				<select class="select select-bordered" bind:value={assistant.model}>
					{#each providers as provider}
						<option disabled>{provider.name}</option>
						{#each provider.models as model}
							<option value={model.id}>{model.display_name}</option>
						{/each}
					{/each}
				</select>
			</div>
			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">API Key</span>
				</div>
				<select class="select select-bordered" bind:value={assistant.apiKey}>
					{#if selected?.provider}
						{#each selected.provider.apiKeys as key}
							<option value={key.id}>{key.label}</option>
						{/each}
					{/if}
				</select>
			</div>
			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">Images</span>
				</div>
				{#if selected?.model?.images}
					<select class="select select-bordered" bind:value={assistant.images}>
						<option value={true}>Yes</option>
						<option value={false}>No</option>
					</select>
				{:else}
					<select class="disabled select select-bordered" disabled value={false}>
						<option value={false}>No</option>
					</select>
				{/if}
			</div>

			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">Prefill</span>
				</div>
				{#if selected?.model?.prefill}
					<select class="select select-bordered" bind:value={assistant.prefill}>
						<option value={true} disabled>Yes</option>
						<option value={false}>No</option>
					</select>
				{:else}
					<select class="select select-bordered" disabled value={false}>
						<option value={false}>No</option>
					</select>
				{/if}
			</div>

			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">Assistant description</span>
				</div>
				<input type="text" class="input input-bordered" bind:value={assistant.about} />
			</div>
			<button
				on:click={() => {
					deleteAssistant(assistant);
				}}
				class="btn btn-outline col-span-1"><Trash2 /></button>

			<div class="col-span-full flex flex-col">
				<div class="flex w-full items-center justify-between">
					<div class="label">
						<span class="label-text"
							>About user. Include into system prompt with <code class="font-bold">{@html `{about}`}</code></span>
					</div>
					<div class="flex items-center gap-2">
						<label for="aboutUserFromUser" class="cursor-pointer text-sm">From user's profile</label>
						<input
							type="checkbox"
							class="checkbox checkbox-xs"
							bind:checked={assistant.aboutUserFromUser}
							id="aboutUserFromUser" />
					</div>
				</div>

				{#if assistant.aboutUserFromUser}
					<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={aboutUser} />
				{:else}
					<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.aboutUser} />
				{/if}
			</div>

			<div class="col-span-full flex flex-col">
				<div class="flex w-full items-center justify-between">
					<div class="label">
						<span class="label-text"
							>Assistant instructions. Include into system prompt with <code class="font-bold"
								>{@html `{instructions}`}</code
							></span>
					</div>
					<div class="flex items-center gap-2">
						<label for="instructionsFromUser" class="cursor-pointer text-sm">From user's profile</label>

						<input
							type="checkbox"
							class="checkbox checkbox-xs"
							bind:checked={assistant.assistantInstructionsFromUser}
							id="instructionsFromUser" />
					</div>
				</div>

				{#if assistant.assistantInstructionsFromUser}
					<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={instructions} />
				{:else}
					<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.assistantInstructions} />
				{/if}
			</div>

			<div class="col-span-full flex flex-col">
				<div class="flex w-full items-center justify-between">
					<div class="label">
						<span class="label-text">System Prompt</span>
					</div>
				</div>

				<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.systemPrompt} />
			</div>
		</div>
	</div>
</div>
