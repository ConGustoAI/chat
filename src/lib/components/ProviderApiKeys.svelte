<script lang="ts">
	import { providerTypes } from '$lib/db/schema';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { capitalize } from '$lib/utils';
	import { getIncrementedName } from '$lib/utils';

	export let provider: ProviderApiKeysInterface;
	export let onDeleteProvider;

	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

	async function addKey(p: typeof provider) {
		console.log('add key', provider);
		provider.apiKeys = [
			{
				label: getIncrementedName(
					provider.name + '-Key-',
					provider.apiKeys.map((a) => a.label)
				),
				key: ''
			},
			...provider.apiKeys
		];
		provider = provider;
	}

	async function delteteAPIKey(p: typeof provider, idx: number) {
		console.log('delete key', p, idx);
		provider.apiKeys = provider.apiKeys.filter((_, index) => index !== idx);
		provider = provider;
	}
</script>

<!-- <div class="divider m-0" /> -->

<div class="card shadow-xl rounded-sm bg-sec">
	<div class="card-body p-3">
		<div class="div flex gap-2">
			<div class="card-actions items-end">
				<button
					class="btn btn-outline btn-sm"
					on:click={() => {
						addKey(provider);
					}}><Plus />API key</button>
			</div>
			<h2 class="card-title">{provider.name}</h2>
		</div>
		<div class="card-actions items-end">
			<div>
				<div class="label">
					<span class="label-text">Label</span>
				</div>
				<input name="providerName" type="text" class="input input-bordered" bind:value={provider.name} />
			</div>

			<div>
				<div class="label">
					<span class="label-text">Type</span>
				</div>
				<select name="providerType" class="select select-bordered" bind:value={provider.type}>
					{#each types as type}
						<option value={type.value}>{capitalize(type.label)}</option>
					{/each}
				</select>
			</div>

			<div class="grow">
				<div class="label">
					<span class="label-text">Base URL</span>
				</div>
				<input name="providerBaseURL" type="text" class="input input-bordered w-full" bind:value={provider.baseURL} />
			</div>
			<button
				class="btn btn-outline"
				on:click={() => {
					onDeleteProvider();
				}}><Trash2 /></button>
		</div>

		<div class="pl-10">
			<!-- <p class="text-lg font-medium">API keys</p> -->
			{#if provider.apiKeys.length}
				<div class="divider m-0" >API keys</div>
				<div class="grid grid-cols-[10rem,auto,min-content] gap-2 items-end">
					<div class="label">
						<span class="label-text">Label</span>
					</div>
					<div class="label">
						<span class="label-text">Key</span>
					</div>
					<div></div>

					{#each provider.apiKeys as apiKey, i}
						<input name="apiKeyLabel" type="text" class="input input-bordered col-span-" bind:value={apiKey.label} />
						<input name="apiKey" type="text" class="input input-bordered" bind:value={apiKey.key} />
						<button
							on:click={() => {
								delteteAPIKey(provider, i);
							}}
							class="btn btn-outline col-span-1"><Trash2 /></button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
