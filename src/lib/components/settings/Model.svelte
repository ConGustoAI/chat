<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { APIhideItem, APIunhideItem } from '$lib/api';
	import { APIupsertModel } from '$lib/api/model';
	import { DeleteButton } from '$lib/components';
	import { dbUser, hiddenItems } from '$lib/stores/appstate';
	import { assert } from '$lib/utils';
	import { Check, Eye, EyeOff } from 'lucide-svelte';

	export let model: ModelInterface;
	export let edit: boolean;
	export let deleteModel;
	export let allowHiding = true;

	// Don't let the user navigate off if changes are unsaved
	let hasUnsavedChanges = false;
	beforeNavigate((navigation) => {
		if (hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				navigation.cancel();
			}
		}
	});

	let status: string | null = null;
	let errorMessage: string | null = null;
	let updateTimer: number | NodeJS.Timeout;

	function debounceModelUpdate() {
		if (status === 'changed') {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(() => {
				if (!$dbUser) {
					goto('/login', { invalidateAll: true });
				}

				status = 'saving';
				APIupsertModel(model)
					.then((res) => {
						assert(!model.id || res.id == model.id, 'model ID mismatch');
						model.id = res.id;
						status = 'saved';
						updateTimer = setTimeout(() => {
							status = null;
						}, 2000);
					})
					.catch((e) => {
						status = 'error';
						errorMessage = e.message;
					});
			}, 750);
		}
	}

	async function toggleHidden() {
		if (!$dbUser) {
			await goto('/login', { invalidateAll: true });
		}

		if (model.id) {
			if ($hiddenItems.has(model.id)) {
				await APIunhideItem(model.id);
				$hiddenItems.delete(model.id);
			} else {
				await APIhideItem(model.id);
				$hiddenItems.add(model.id);
			}
			$hiddenItems = $hiddenItems;
		}
	}

	function statusChanged() {
		status = 'changed';
	}

	$: {
		debounceModelUpdate();
		hasUnsavedChanges = !!(status && status != 'saved');
	}
</script>

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={model.displayName}
	on:input={statusChanged}
	spellcheck="false"
	disabled={!edit || status === 'deleting'} />

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={model.name}
	spellcheck="false"
	disabled={!edit || status === 'deleting'}
	on:input={statusChanged} />
<input
	type="number"
	class="input input-bordered w-28"
	bind:value={model.inputContext}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />

<input
	type="number"
	class="input input-bordered w-16"
	bind:value={model.inputCost}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />
<input
	type="number"
	class="input input-bordered w-28"
	bind:value={model.outputContext}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />

<input
	type="number"
	class="input input-bordered w-16"
	bind:value={model.outputCost}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />
<input
	type="number"
	class="input input-bordered w-14"
	bind:value={model.maxTemp}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />

<!-- <input
	type="checkbox"
	class="checkbox"
	bind:checked={model.streaming}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} /> -->

<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.images}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />
<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.audio}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />
<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.video}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />
<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.prefill}
	on:input={statusChanged}
	disabled={!edit || status === 'deleting'} />

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
	{:else if $hiddenItems.has(model.id ?? '') && allowHiding}
		<EyeOff />
	{:else}
		<Eye />
	{/if}
</button>

<DeleteButton
	btnClass="btn btn-outline"
	deleteAction={async () => {
		status = 'deleting';
		await deleteModel(model);
		status = null;
	}}
	size={24}
	disabled={!edit || status === 'deleting'} />

<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute top-1" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{errorMessage}</span>
</div>
