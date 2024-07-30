<script lang="ts">
	import { providerTypes } from '$lib/db/schema';
	import { Images, Plus, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { capitalize } from '$lib/utils';
	import { getIncrementedName } from '$lib/utils';
	import { check } from 'drizzle-orm/mysql-core';

	export let assistant: AssistantInterface;
	export let providers: ProviderAssistantInterface[];
	// export let aboutUser: string;
	// export let assistantInstructions: string;

	// "providers": [
	// {
	//   "id": "6141c71e-8d2a-4bd8-9e06-e85ebb76f23e",
	//   "name": "Anthropic",
	//   "type": "anthropic",
	//   "models": [
	//     {
	//       "id": "e156eed5-15eb-4f88-99b4-f75d40074417",
	//       "name": "dfffff",
	//       "display_name": "sdfs",
	//       "images": false,
	//       "prefill": false,
	//       "inputContext": 1234,
	//       "providerID": "6141c71e-8d2a-4bd8-9e06-e85ebb76f23e"
	//     }
	//   ],

	function findProvider(p: typeof providers, modelID?: string) {
		if (!modelID) return null;
		for (let provider of p) {
			for (let model of provider.models) {
				if (model.id === modelID) {
					return provider;
				}
			}
		}
	}

	$: selected_provider = findProvider(providers, assistant.model);

	// export let provider: ProviderModelsInterface;
	// let types = providerTypes.enumValues.map((type) => {
	// 	return { value: type, label: type };
	// });

	// async function addModel(p: typeof provider) {
	// 	console.log('add model', provider);
	// 	provider.models = [
	// 		{
	// 			name: '',
	// 			display_name: '',
	// 			images: false,
	// 			prefill: false,
	// 			providerID: provider.id,
	// 			inputContext: 8192
	// 		},
	// 		...provider.models
	// 	];
	// 	provider = provider;
	// }
	// async function deleteModel(p: typeof provider, idx: number) {
	// 	console.log('delete model', p, idx);
	// 	provider.models = provider.models.filter((_, index) => index !== idx);
	// 	provider = provider;
	// }
</script>

<div class="card shadow-xl rounded-sm bg-sec">
	<div class="card-body p-3">
		<div class="div flex gap-2">
			<h2 class="card-title">{assistant.name}</h2>
		</div>

		<div class="grid grid-cols-[15rem,min-content,min-content,auto] gap-2">
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
					{#if selected_provider}
						{#each selected_provider.apiKeys as key}
							<option value={key.id}>{key.label}</option>
						{/each}
					{/if}
				</select>
			</div>
			<div class="flex flex-col">
				<div class="label">
					<span class="label-text">Assistant description</span>
				</div>
				<input type="text" class="input input-bordered" bind:value={assistant.about} />
			</div>

			<div class="flex flex-col col-span-4">
				<div class="flex justify-between items-center w-full">
					<div class="label">
						<span class="label-text">About user. Include into system prompt with <code class="font-bold">{@html `{about}`}</code></span>
					</div>
					<div class="flex items-center gap-2">
						<label for="aboutUserFromUser" class="cursor-pointer text-sm">From user's profile</label>
						<input type="checkbox" class="checkbox checkbox-xs" bind:checked={assistant.aboutUserFromUser} id="aboutUserFromUser" />
					</div>
				</div>

				<textarea class="textarea textarea-bordered w-full" rows="3" disabled={assistant.aboutUserFromUser} bind:value={assistant.aboutUser} />
			</div>

			<div class="flex flex-col col-span-4">
				<div class="flex justify-between items-center w-full">
					<div class="label">
						<span class="label-text">Assistant instructions. Include into system prompt with <code class="font-bold">{@html `{instructions}`}</code></span>
					</div>
					<div class="flex items-center gap-2">
						<label for="instructionsFromUser" class="cursor-pointer text-sm">From user's profile</label>
						<input type="checkbox" class="checkbox checkbox-xs" bind:checked={assistant.assistantInstructionsFromUser} id="instructionsFromUser" />
					</div>
				</div>

				<textarea
					class="textarea textarea-bordered w-full"
					disabled={assistant.assistantInstructionsFromUser}
					rows="3"
					bind:value={assistant.assistantInstructions} />
			</div>

			<div class="flex flex-col col-span-4">
				<div class="flex justify-between items-center w-full">
					<div class="label">
						<span class="label-text">System Prompt</span>
					</div>
				</div>

				<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.systemPrompt} />
			</div>
		</div>

		<!-- <div class="pl-10">
				<div class="divider m-0" />
				<div class="grid grid-cols-[15rem,auto,10rem,min-content] gap-2 items-end">
					<div class="label">
						<span class="label-text">Display name</span>
					</div>
					<div class="label">
						<span class="label-text">Model name</span>
					</div>
					<div class="label">
						<span class="label-text">Input context lenght</span>
					</div>

					<div></div>

					{#each provider.models as model, i}
						<input type="text" class="input input-bordered" bind:value={model.display_name} />
						<input type="text" class="input input-bordered" bind:value={model.name} />
						<input type="number" class="input input-bordered" bind:value={model.inputContext} />
						<button
							on:click={() => {
								deleteModel(provider, i);
							}}
							class="btn btn-outline col-span-1"><Trash2 /></button>

						<div class="div flex col-span-4 gap-2 mb-4">
							<div class="flex items-center min-w-fit gap-2">
								<label for={`images-${i}`} class="cursor-pointer" title="The model can accept images"> Supports images </label>
								<input id={`images-${i}`} name={`images-${i}`} type="checkbox" class="checkbox mr-2" bind:checked={model.images} />
							</div>
							<div class="flex items-center gap-2">
								<label for={`prefill-${i}`} class="cursor-pointer" title="The model lets you pass the start of the agents reply"> Supports prfill </label>
								<input id={`prefill-${i}`} name={`prfill-${i}`} type="checkbox" class="checkbox mr-2" bind:checked={model.prefill} />
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div> -->
	</div>
</div>
