<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIhideItem, APIunhideItem, APIupsertAssistant } from '$lib/api';
	import { DeleteButton, GrowInput } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { apiKeys, dbUser, hiddenItems, models, providers } from '$lib/stores/appstate';
	import { toLogin } from '$lib/stores/loginModal';
	import { assert } from '$lib/utils';
	import { Check, Copy, Eye, EyeOff } from 'lucide-svelte';
	import dbg from 'debug';
	import AssistantDefails from './AssistantDetails.svelte';
	const debug = dbg('app:ui:components:Assistant');

	export let assistant: AssistantInterface;
	export let deleteAssistant;
	export let copyAssistant;
	export let edit: boolean;
	export let showDefault: boolean;
	export let allowHiding = true;

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
		debug('statusChanged');
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

	let detailsToggled = true;

	async function toggleHidden() {
		if (!$dbUser) {
			toLogin();
			return;
		}

		if (assistant.id && allowHiding) {
			if ($hiddenItems.has(assistant.id)) {
				await APIunhideItem(assistant.id);
				$hiddenItems.delete(assistant.id);
			} else {
				await APIhideItem(assistant.id);
				$hiddenItems.add(assistant.id);
			}
			$hiddenItems = $hiddenItems;
		}
	}

	let yourProviders: typeof $providers;
	let defaultProviders: typeof $providers;

	$: yourProviders = Object.fromEntries(
		Object.entries($providers).filter(
			([pidx, provider]) => provider.userID === $dbUser?.id && !$hiddenItems.has(provider.id!)
		)
	);
	$: defaultProviders = Object.fromEntries(
		Object.entries($providers).filter(
			([pidx, provider]) => provider.userID === defaultsUUID && !$hiddenItems.has(provider.id!)
		)
	);

	$: model = assistant.model ? $models[assistant.model] : null;
	$: provider = model ? $providers[model.providerID] : null;
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
	{#if Object.keys(yourProviders).length}
		<option disabled class="text-lg font-bold">Your providers</option>
		{#each Object.entries(yourProviders) as [pidx, provider]}
			<!-- <option disabled class="text-lg font-bold">{provider.name}</option> -->
			{#each Object.entries($models) as [midx, model]}
				{#if model.id && model.providerID === provider.id && !$hiddenItems.has(model.id)}
					<option value={model.id}>{provider.name}/{model.displayName}</option>
				{/if}
			{/each}
		{/each}
	{/if}

	{#if Object.keys(defaultProviders).length}
		<option disabled class="text-lg font-bold">Default providers</option>
		{#each Object.entries(defaultProviders) as [pidx, provider]}
			<!-- <option disabled class="text-lg font-bold">{provider.name}</option> -->
			{#each Object.entries($models) as [midx, model]}
				{#if model.id && model.providerID === provider.id && !$hiddenItems.has(model.id)}
					<option value={model.id}>{provider.name}/{model.displayName}</option>
				{/if}
			{/each}
		{/each}
	{/if}
</select>

<select class="select select-bordered" bind:value={assistant.apiKey} on:change={statusChanged} disabled={!edit}>
	{#if assistant.model}
		{@const model = $models[assistant.model]}
		{@const provider = model ? $providers[model.providerID] : null}
		{#if provider}
			<option value={defaultsUUID}>First available</option>

			{#each Object.entries($apiKeys) as [kid, key]}
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
	disabled={status === 'hiding' || !allowHiding}
	on:click={async () => {
		status = 'hiding';
		await toggleHidden();
		status = null;
	}}>
	{#if status === 'hiding'}
		<div class="loading" />
	{:else if $hiddenItems.has(assistant.id ?? '') && allowHiding}
		<EyeOff />
	{:else}
		<Eye />
	{/if}
</button>

<DeleteButton
	btnClass="btn btn-outline"
	deleteAction={async () => {
		status = 'deleting';
		await deleteAssistant(assistant);
		status = null;
	}}
	size={24}
	disabled={!edit || status === 'deleting'} />

<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{statusMessage}</span>
</div>

{#if detailsToggled && model && provider}
	<div class="col-span-full col-start-2 w-full">
		<div class="divider">{assistant.name}: Details</div>
	</div>

	<div class="col-span-full col-start-2 mb-6 flex w-full flex-col gap-2">
		{#if showDefault && edit}
			<div class="divider w-full">
				<div class="alert alert-warning w-fit py-0">Changes made here will be visible to and will affect all users</div>
			</div>
		{/if}

		<AssistantDefails bind:assistant {edit} {statusChanged} {model} {provider} />

		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<span class=" px-1 py-2 text-sm"
					>About user. Include into system prompt with <code class="font-bold">{@html `{about}`}</code></span>

				<div class="flex items-center gap-2">
					{#if assistant.aboutUserFromUser}
						<a href="/settings" class="link text-sm">Edit your profile</a>
					{/if}
					<label for="aboutUserFromUser" class="cursor-pointer text-sm">From my profile</label>
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
				<GrowInput
					class="textarea-bordered w-full"
					value={$dbUser?.aboutUser ?? ''}
					on:change={statusChanged}
					disabled={true} />
			{:else}
				<GrowInput class="textarea-bordered w-full" bind:value={assistant.aboutUser} on:change={statusChanged} />
			{/if}
		</div>

		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<span class="px-1 py-2 text-sm"
					>Assistant instructions. Include into system prompt with <code class="font-bold"
						>{@html `{instructions}`}</code
					></span>

				<div class="flex items-center gap-2">
					{#if assistant.assistantInstructionsFromUser}
						<a href="/settings" class="link text-sm">Edit your profile</a>
					{/if}
					<label for="instructionsFromUser" class="cursor-pointer text-sm">From my profile</label>
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
				<GrowInput
					class="textarea-bordered w-full"
					value={$dbUser?.assistantInstructions ?? ''}
					on:input={statusChanged}
					disabled={true} />
			{:else}
				<GrowInput
					class="textarea-bordered w-full"
					bind:value={assistant.assistantInstructions}
					on:input={statusChanged}
					disabled={!edit} />
			{/if}
		</div>

		<div class="col-span-full flex flex-col">
			<div class="flex w-full items-center justify-between">
				<span class="px-1 py-2 text-sm">System Prompt</span>
			</div>

			<GrowInput
				class="textarea-bordered whitespace-pre-wrap text-wrap"
				bind:value={assistant.systemPrompt}
				on:input={statusChanged}
				disabled={!edit} />
		</div>
	</div>
{/if}
