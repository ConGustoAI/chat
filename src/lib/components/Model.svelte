<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIupsertModel } from '$lib/api/model';
	import { assert } from '$lib/utils';
	import { Check, Trash2 } from 'lucide-svelte';
	import { toLogin } from '$lib/stores/loginModal';
	import { dbUser } from '$lib/stores/appstate';

	export let model: ModelInterface;
	export let edit: boolean;
	export let deleteModel;

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
					toLogin();
					return;
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
	class="btn btn-outline w-full justify-self-end"
	disabled={!edit || status === 'deleting'}
	on:click={async () => {
		status = 'deleting';
		await deleteModel(model);
		status = null;
	}}>
	{#if status === 'deleting'}
		<div class="loading" />
	{:else}
		<Trash2 />
	{/if}
</button>
<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute top-1" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{errorMessage}</span>
</div>
