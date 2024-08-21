<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIupsertAssistant } from '$lib/api';
	import { defaultsUUID } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import { assert } from '$lib/utils';
	import { Check, Copy, Trash2 } from 'lucide-svelte';
	import { dbUser, models, providers, apiKeys } from '$lib/stores/appstate';

	export let assistant: AssistantInterface;
	export let deleteAssistant;
	export let copyAssistant;
	export let edit: boolean;
	export let showDefault: boolean;

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
				if (!$dbUser) {
					toLogin();
					return;
				}
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
		if (assistant.images && assistant.model && !$models[assistant.model].images) {
			assistant.images = false;
		}
		if (assistant.audio && assistant.model && !$models[assistant.model].audio) {
			assistant.audio = false;
		}
		if (assistant.video && assistant.model && !$models[assistant.model].video) {
			assistant.video = false;
		}
		if (assistant.prefill && assistant.model && !$models[assistant.model].prefill) {
			assistant.prefill = false;
		}

		status = 'changed';
	}

	let detailsToggled = false;
</script>

<button
	class="btn btn-outline"
	on:click={async () => {
		status = 'copying';
		await copyAssistant(assistant);
		status = null;
	}}
	disabled={status === 'copying'}>
	{#if status === 'copying'}
		<div class="loading" />
	{:else}
		<Copy />
	{/if}
</button>

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={assistant.name}
	on:input={statusChanged}
	spellcheck="false"
	disabled={!edit} />

<select class="select select-bordered w-full" bind:value={assistant.model} on:change={statusChanged} disabled={!edit}>
	{#each Object.entries($providers) as [pidx, provider]}
		<option disabled class="text-lg font-bold">{provider.name}</option>
		{#each Object.entries($models) as [midx, model]}
			{#if model.providerID === provider.id}
				<option value={model.id}>{provider.name}/{model.displayName}</option>
			{/if}
		{/each}
	{/each}
</select>

<select class="select select-bordered" bind:value={assistant.apiKey} on:change={statusChanged} disabled={!edit}>
	{#if assistant.model}
		{@const model = $models[assistant.model]}
		{@const provider = $providers[model.providerID]}

		<option value={defaultsUUID}>First available</option>

		{#each Object.entries($apiKeys) as [kid, key]}
			{#if key.providerID === model.providerID}
				<option value={key.id}>{provider.name}/{key.label}</option>
			{/if}
		{/each}
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
		await deleteAssistant(assistant);
		status = null;
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
	{@const model = assistant.model ? $models[assistant.model] : undefined}
	<div class="col-span-full col-start-2 w-full">
		<div class="divider">{assistant.name}: Details</div>
	</div>

	<div class="col-span-full col-start-2 mb-6 flex w-full flex-col gap-2">
		{#if showDefault && edit}
			<div class="divider w-full">
				<div class="alert alert-warning w-fit py-0">Changes made here will be visible to and will affect all users</div>
			</div>
		{/if}
		<div class="my-4 flex gap-4">
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
				<textarea class="textarea textarea-bordered w-full" rows="3" disabled value={$dbUser?.aboutUser} />
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
				<textarea
					class="textarea textarea-bordered w-full"
					rows="3"
					disabled
					value={$dbUser?.assistantInstructions} />
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
