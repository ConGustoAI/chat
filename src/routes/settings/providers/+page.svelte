<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { providerTypes, providersTable, apiKeysTable } from '$lib/db/schema';
	import type { InferModel } from 'drizzle-orm';
	export let data;

	import { Plus } from 'lucide-svelte';
	import { ChevronDown, Trash, Trash2 } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	export let providers = data.providers;

	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

	async function submitData(provider: (typeof providers)[0]) {
		console.log('submit', provider);

		const { id, name, type, baseURL } = provider;
		const res1 = await fetch('/api/provider', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},

			body: JSON.stringify({ id, name, type, baseURL })
		});

		if (!res1.ok) {

		}

		const res2 = await fetch('/api/apikeys/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(provider.apiKeys)
		});

		if (res1.ok) {
			provider.apiKeys = (await response.json()).updated;
			// await invalidateAll();
		}
	}

	async function addKey(provider: (typeof data.providers)[0]) {
		console.log('add key', provider);
		provider.apiKeys = [...provider.apiKeys, { provider: provider.id, label: '', key: '' }];
		providers = providers;
	}

	function delteteAPIKey(provider: (typeof data.providers)[0], i: number) {
		console.log('delete key', provider, i);
		provider.apiKeys = provider.apiKeys.filter((_, index) => index !== i);
		providers = providers;
	}

	//     [
	//         { value: "apple", label: "Apple" },
	//         { value: "banana", label: "Banana" },
	//         { value: "blueberry", label: "Blueberry" },
	//         { value: "grapes", label: "Grapes" },
	//         { value: "pineapple", label: "Pineapple" }
	//   ];
</script>

<div class="space-y-2">
	<div>
		<h3 class="text-lg font-medium">API providers</h3>
		<!-- <p class="text-muted-foreground text-sm">This is how others will see you on the site.</p> -->
	</div>
	<div class="divider"></div>

	{#each providers as provider, i}
		<div class="collapse collapse-arrow bg-base-200">
			<input type="radio" name="providers" checked={i == 0} />
			<div class="collapse-title text-xl font-medium">{provider.name}</div>
			<div class="collapse-content">
				<div class="divider" />
				<div class="flex items-end">
					<!-- <div class="hidden">
						<div class="label">
							<span class="label-text">Provider id</span>
						</div>
						<input name="providerID" type="text" class="input input-bordered" value={data.providers[0].id} />
					</div> -->

					<div>
						<div class="label">
							<span class="label-text">Provider name</span>
						</div>
						<input name="providerName" type="text" class="input input-bordered" bind:value={provider.name} />
					</div>

					<div>
						<div class="label">
							<span class="label-text">Provider type</span>
						</div>
						<select name="providerType" class="select select-bordered">
							{#each types as type}
								<option value={type.value} selected={provider.type === type.value}>{type.label}</option>
							{/each}
						</select>
					</div>

					<div>
						<div class="label">
							<span class="label-text">Base URL</span>
						</div>
						<input name="providerBaseURL" type="text" class="input input-bordered" value={provider.baseURL} />
					</div>
					<button
						class="btn btn-outline"
						on:click={() => {
							deleteProvider(provider);
						}}>Delete</button
					>
				</div>

				<div>
					<p class="text-lg font-medium">API keys</p>
					{#if provider.apiKeys.length}
						{#each provider.apiKeys as apiKey, i}
							<div class="flex items-end">
								{#if i == 0}
									<button
										class="btn btn-outline btn-circle size-8"
										on:click={() => {
											addKey(provider);
										}}><Plus /></button
									>
								{/if}

								<div>
									<div class="label">
										<span class="label-text">Label</span>
									</div>
									<input name="apiKeyLabel" type="text" class="input input-bordered" bind:value={apiKey.label} />
								</div>
								<div>
									<div class="label">
										<span class="label-text">Key</span>
									</div>
									<input name="apiKey" type="text" class="input input-bordered" bind:value={apiKey.key} />
								</div>
								<button
									on:click={() => {
										delteteAPIKey(provider, i);
									}}
									class="btn btn-outline">Delete key</button
								>
							</div>
						{/each}
					{/if}
				</div>

				<button
					class="btn btn-primary"
					on:click={() => {
						submitData(provider);
					}}>Submit</button
				>
			</div>
		</div>
	{/each}

	<!-- {#each data.providers as provider}
		<div class="div flex">
			<Input type="text" bind:value={provider.name} class="max-w-xs" />

			<Select.Root portal={null} bind:selected={provider.type}>
				<Select.Trigger class="w-[180px]">
					<Select.Value />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>

						{#each types as type}
							<Select.Item value={type.value} label={type.label}>{type.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
				<Select.Input name="providerType" />
			</Select.Root>
		</div>
	{/each} -->

	<pre>{JSON.stringify(data, null, 2)}</pre>
</div>
