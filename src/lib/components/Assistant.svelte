<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { upsertAssistant } from '$lib/api';
	import { assert } from '$lib/utils';
	import { Check, Trash2 } from 'lucide-svelte';

	export let assistant: AssistantInterface;
	export let models: ModelInterface[];
	export let providers: ProviderInterface[];
	export let dbUser: UserInterface | undefined;
	export let onDeleteAssistant;
	export let i: number;

	let status: string | null = null;
	let statusMessage: string | null = null;
	let updateTimer: number | NodeJS.Timeout;

	// Don't let the user navigate off if changes are unsaved
	let hasUnsavedChanges = false;
	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				navigation.cancel();
			}
		}
	});

	$: {
		debounceAssistantUpdate();
		hasUnsavedChanges = !!(status && status != 'saved');
		assistant = assistant;
	}

	function debounceAssistantUpdate() {
		if (status === 'changed') {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(() => {
				status = 'saving';
				upsertAssistant(assistant)
					.then((res) => {
						console.log('res', res);
						status = 'saved';
						assert(!assistant.id || assistant.id === res.id, "Returned assistant ID doesn't match");
						assistant.id = res.id;
						updateTimer = setTimeout(() => {
							status = null;
						}, 2000);
					})
					.catch((e) => {
						status = 'error';
						statusMessage = e.message;
					})
					.finally(() => {});
			}, 750);
		}
	}

	function statusChanged() {
		status = 'changed';
	}

	$: provider = providers.find((p) => p?.models?.some((m) => m.id === assistant.model));
	$: model = models.find((m) => m.id === assistant.model);

	let detailsToggled = false;
</script>

<input type="text" class="input input-bordered w-full" bind:value={assistant.name} on:input={statusChanged} spellcheck="false" />

<select class="select select-bordered w-full" bind:value={assistant.model} on:change={statusChanged}>
	{#each providers as provider}
		<option disabled class="text-lg font-bold">{provider.name}</option>
		{#if provider.models}
			{#each provider.models as model}
				<option value={model.id}>{model.displayName}</option>
			{/each}
		{/if}
	{/each}
</select>

<select class="select select-bordered" bind:value={assistant.apiKey}>
	{#if provider && provider.apiKeys}
		{#each provider.apiKeys as key}
			<option value={key.id}>{key.label}</option>
		{/each}
	{:else}
		<option disabled>No API keys</option>
	{/if}
</select>

<input type="text" class="input input-bordered w-full" bind:value={assistant.about} spellcheck="false" on:change={statusChanged} />
<button class="btn btn-outline w-full" on:click={() => (detailsToggled = !detailsToggled)}> Details </button>

<button
	class="btn btn-outline"
	on:click={() => {
		status = 'saving';
		onDeleteAssistant();
	}}>
	<Trash2 />
</button>

<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{statusMessage}</span>
</div>

{#if detailsToggled}
	<div class="col-span-7 mb-6 w-full">
		<div class="divider">{assistant.name} Details</div>
	</div>

	<div class="col-span-full mb-6 flex w-full flex-col gap-2">
		<div class="flex gap-4">
			<label for="imagesCheckbox{i}" class="cursor-pointer">Images</label>
			<input
				type="checkbox"
				id="imagesCheckbox{i}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.images}
				disabled={!model?.images}
				on:change={statusChanged} />

			<label for="audioCheckbox{i}" class="cursor-pointer">Audio</label>
			<input
				type="checkbox"
				id="audioCheckbox{i}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.audio}
				disabled={!model?.audio}
				on:change={statusChanged} />

			<label for="videoCheckbox{i}" class="cursor-pointer">Video</label>
			<input
				type="checkbox"
				id="videoCheckbox{i}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.video}
				disabled={!model?.video}
				on:change={statusChanged} />

			<label for="prefillCheckbox{i}" class="cursor-pointer">Prefill</label>
			<input
				type="checkbox"
				id="prefillCheckbox{i}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.prefill}
				disabled={!model?.prefill}
				on:change={statusChanged} />
		</div>
		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<div class="label">
					<span class="label-text">About user. Include into system prompt with <code class="font-bold">{@html `{about}`}</code></span>
				</div>
				<div class="flex items-center gap-2">
					<label for="aboutUserFromUser" class="cursor-pointer text-sm">From user's profile</label>
					<input type="checkbox" class="checkbox checkbox-xs" bind:checked={assistant.aboutUserFromUser} id="aboutUserFromUser" on:change={statusChanged} />
				</div>
			</div>

			{#if assistant.aboutUserFromUser}
				<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={dbUser?.aboutUser} />
			{:else}
				<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.aboutUser} on:change={statusChanged} />
			{/if}
		</div>

		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<div class="label">
					<span class="label-text">Assistant instructions. Include into system prompt with <code class="font-bold">{@html `{instructions}`}</code></span>
				</div>
				<div class="flex items-center gap-2">
					<label for="instructionsFromUser" class="cursor-pointer text-sm">From user's profile</label>

					<input type="checkbox" class="checkbox checkbox-xs" bind:checked={assistant.assistantInstructionsFromUser} id="instructionsFromUser" on:change={statusChanged} />
				</div>
			</div>

			{#if assistant.assistantInstructionsFromUser}
				<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={dbUser?.assistantInstructions} />
			{:else}
				<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.assistantInstructions} on:change={statusChanged} />
			{/if}
		</div>

		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<div class="label">
					<span class="label-text">System Prompt</span>
				</div>
			</div>

			<textarea class="textarea textarea-bordered w-full" rows="3" bind:value={assistant.systemPrompt} on:change={statusChanged} />
		</div>
	</div>
{/if}
