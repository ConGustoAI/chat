<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIupsertAssistant } from '$lib/api';
	import { defaultsUUID } from '$lib/db/schema';
	import { assert } from '$lib/utils';
	import { Check, Trash2 } from 'lucide-svelte';

	export let assistant: AssistantInterface;
	export let models: { [key: string]: ModelInterface };
	export let providers: { [key: string]: ProviderInterface };
	export let apiKeys: { [key: string]: ApiKeyInterface };
	export let dbUser: UserInterface | undefined;
	export let deleteAssistant;
	export let edit: boolean;

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
				APIupsertAssistant(assistant)
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

	// $: provider = providers.find((p) => p?.models?.some((m) => m.id === assistant.model));
	// $: model = models.find((m) => m.id === assistant.model);

	let detailsToggled = false;
</script>

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={assistant.name}
	on:input={statusChanged}
	spellcheck="false"
	disabled={!edit} />

<select class="select select-bordered w-full" bind:value={assistant.model} on:change={statusChanged} disabled={!edit}>
	{#each Object.entries(providers) as [pidx, provider]}
		<option disabled class="text-lg font-bold">{provider.name}</option>
		{#each Object.entries(models) as [midx, model]}
			{#if model.providerID === provider.id}
				<option value={model.id}>{provider.name}/{model.displayName}</option>
			{/if}
		{/each}
	{/each}
</select>

<select class="select select-bordered" bind:value={assistant.apiKey} on:change={statusChanged} disabled={!edit}>
	{#if assistant.model}
		{@const model = models[assistant.model]}
		{@const provider = providers[model.providerID]}
		{@const hasKey = Object.values(apiKeys).some((k) => k.providerID === model.providerID)}

		{#if !hasKey}
			<option disabled>No API keys</option>
		{:else}
			<option disabled>Select API key</option>

			{#each Object.entries(apiKeys) as [kid, key]}
				{#if key.providerID === model.providerID}
					<option value={key.id}>{provider.name}/{key.label}</option>
				{/if}
			{/each}
		{/if}
	{:else}
		<option disabled>No model</option>
	{/if}
</select>

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={assistant.about}
	spellcheck="false"
	on:change={statusChanged}
	disabled={!edit} />

<button
	class="btn btn-outline w-full"
	on:click={() => (detailsToggled = !detailsToggled)}
	class:btn-active={detailsToggled}>
	Details
</button>

<button
	class="btn btn-outline"
	on:click={async () => {
		status = 'deleting';
		await deleteAssistant();
	}}
	disabled={!edit || status === 'deleting'}>
	{#if status === 'deleting'}
		<div class="loading" />
	{:else}
		<Trash2 />
	{/if}
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
	{@const model = assistant.model ? models[assistant.model] : undefined}
	<div class="col-span-7 mb-6 w-full">
		<div class="divider">{assistant.name} Details</div>
	</div>

	<div class="col-span-full mb-6 flex w-full flex-col gap-2">
		<div class="flex gap-4">
			<label for="imagesCheckbox-{assistant.id}" class="cursor-pointer">Images</label>
			<input
				type="checkbox"
				id="imagesCheckbox-{assistant.id}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.images}
				disabled={!model?.images || !edit}
				on:change={statusChanged} />

			<label for="audioCheckbox-{assistant.id}" class="cursor-pointer">Audio</label>
			<input
				type="checkbox"
				id="audioCheckbox-{assistant.id}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.audio}
				disabled={!model?.audio || !edit}
				on:change={statusChanged} />

			<label for="videoCheckbox-{assistant.id}" class="cursor-pointer">Video</label>
			<input
				type="checkbox"
				id="videoCheckbox-{assistant.id}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.video}
				disabled={!model?.video || !edit}
				on:change={statusChanged} />

			<label for="prefillCheckbox-{assistant.id}" class="cursor-pointer">Prefill</label>
			<input
				type="checkbox"
				id="prefillCheckbox-{assistant.id}"
				class="checkbox checkbox-sm"
				bind:checked={assistant.prefill}
				disabled={!model?.prefill || !edit}
				on:change={statusChanged} />
		</div>
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
						id="aboutUserFromUser"
						on:change={statusChanged}
						disabled={!edit} />
				</div>
			</div>

			{#if assistant.aboutUserFromUser}
				<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={dbUser?.aboutUser} />
			{:else}
				<textarea
					class="textarea textarea-bordered w-full"
					rows="3"
					bind:value={assistant.aboutUser}
					on:change={statusChanged}
					disabled={!edit} />
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
						id="instructionsFromUser"
						on:change={statusChanged}
						disabled={!edit} />
				</div>
			</div>

			{#if assistant.assistantInstructionsFromUser}
				<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={dbUser?.assistantInstructions} />
			{:else}
				<textarea
					class="textarea textarea-bordered w-full"
					rows="3"
					bind:value={assistant.assistantInstructions}
					on:change={statusChanged}
					disabled={!edit} />
			{/if}
		</div>

		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<div class="label">
					<span class="label-text">System Prompt</span>
				</div>
			</div>

			<textarea
				class="textarea textarea-bordered w-full"
				rows="3"
				bind:value={assistant.systemPrompt}
				on:change={statusChanged}
				disabled={!edit} />
		</div>
	</div>
{/if}
