<script lang="ts">
	import { providerTypes } from '$lib/db/schema';
	import { Images, Plus, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { capitalize } from '$lib/utils';
	import { getIncrementedName } from '$lib/utils';
	import { check } from 'drizzle-orm/mysql-core';

	export let provider: ProviderModelsInterface;
	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

	async function addModel(p: typeof provider) {
		console.log('add model', provider);
		provider.models = [
			{
				name: '',
				display_name: '',
				images: false,
				prefill: false,
				providerID: provider.id,
				inputContext: 8192
			},
			...provider.models
		];
		provider = provider;
	}
	async function deleteModel(p: typeof provider, idx: number) {
		console.log('delete model', p, idx);
		provider.models = provider.models.filter((_, index) => index !== idx);
		provider = provider;
	}
</script>

<div class="card shadow-xl rounded-sm bg-sec">
	<div class="card-body p-3">
		<div class="div flex gap-2">
			<div class="card-actions items-end">
				<button
					class="btn btn-outline btn-sm"
					on:click={() => {
						addModel(provider);
					}}><Plus />Model</button>
			</div>
			<h2 class="card-title">{provider.name}</h2>
		</div>

		<div class="pl-10">
			{#if provider.models.length}
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
						<!-- <div class="divider col-span-full m-0"></div> -->

						<!-- <input name="apiKey" type="text" class="input input-bordered" bind:value={model.key} /> -->
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
