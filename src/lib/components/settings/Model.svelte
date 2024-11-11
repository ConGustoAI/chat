<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { APIhideItem, APIunhideItem } from '$lib/api';
	import { APIupsertModel } from '$lib/api/model';
	import { DeleteButton } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { assert } from '$lib/utils/utils';
	import { Check, Eye, EyeOff } from 'lucide-svelte';
	import dbg from 'debug';
	const debug = dbg('app:lib:components:Model');

	let {
		model = $bindable(),
		edit,
		deleteModel,
		allowHiding = true
	}: {
		model: ModelInterface;
		edit: boolean;
		deleteModel: (model: ModelInterface) => Promise<void>;
		allowHiding?: boolean;
	} = $props();

	let status: 'changed' | 'saving' | 'saved' | 'error' | 'deleting' | 'hiding' | null | undefined = $state(undefined);
	let errorMessage: string | null = $state(null);
	let updateTimer: ReturnType<typeof setTimeout> | undefined;

	// Don't let the user navigate off if changes are unsaved
	beforeNavigate((navigation) => {
		if (status && status != 'saved') {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				navigation.cancel();
			}
		}
	});

	async function updateModelNow() {
		if (!A.user) {
			goto('/login', { invalidateAll: true });
		}
		if (status !== 'changed') return;
		status = 'saving';
		const res = await APIupsertModel(model)
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
		status = 'saved';
		Object.assign(model, res);
	}

	function debounceModelUpdate() {
		debug('debounceModelUpdate');
		clearTimeout(updateTimer);
		updateTimer = setTimeout(updateModelNow, 750);
	}

	async function toggleHidden() {
		if (!A.user) {
			await goto('/login', { invalidateAll: true });
		}

		if (model.id) {
			if (A.hiddenItems.has(model.id)) {
				await APIunhideItem(model.id);
				A.hiddenItems.delete(model.id);
			} else {
				await APIhideItem(model.id);
				A.hiddenItems.add(model.id);
			}
		}
	}

	$inspect(status);
</script>

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={model.displayName}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		status = 'changed';
		updateModelNow();
	}}
	spellcheck="false"
	disabled={!edit || status === 'deleting'} />

<input
	type="text"
	class="input input-bordered w-full"
	bind:value={model.name}
	spellcheck="false"
	disabled={!edit || status === 'deleting'}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		status = 'changed';
		clearTimeout(updateTimer);
		updateModelNow();
	}} />
<input
	type="number"
	class="no-spinner input input-bordered w-28"
	bind:value={model.inputContext}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />

<input
	type="number"
	class="no-spinner input input-bordered w-16"
	bind:value={model.inputCost}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />
<input
	type="number"
	class="no-spinner input input-bordered w-28"
	bind:value={model.outputContext}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />

<input
	type="number"
	class="no-spinner input input-bordered w-16"
	bind:value={model.outputCost}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />
<input
	type="number"
	class="no-spinner input input-bordered w-14"
	bind:value={model.maxTemp}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />

<!-- <input
	type="checkbox"
	class="checkbox"
	bind:checked={model.streaming}
	oninput={() => {status = "chaged"}}
	disabled={!edit || status === 'deleting'} /> -->
<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.prefill}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />

<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.images}
	oninput={() => {
		status = 'changed';
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />
<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.audio}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />
<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.video}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />

<input
	type="checkbox"
	class="checkbox"
	bind:checked={model.pdf}
	oninput={() => {
		status = 'changed';
		debounceModelUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateModelNow();
	}}
	disabled={!edit || status === 'deleting'} />

<button
	class="btn btn-outline"
	disabled={status === 'hiding' || !allowHiding}
	onclick={async () => {
		status = 'hiding';
		await toggleHidden();
		status = null;
	}}>
	{#if status === 'hiding'}
		<div class="loading"></div>
	{:else if A.hiddenItems.has(model.id ?? '') && allowHiding}
		<EyeOff />
	{:else}
		<Eye />
	{/if}
</button>

<DeleteButton
	btnClass="btn btn-outline h-full w-full"
	class=""
	deleteAction={async () => {
		status = 'deleting';
		await deleteModel(model);
		status = null;
	}}
	disabled={!edit || status === 'deleting'} />

<div class="relative self-center">
	<div class="loading absolute top-1" class:hidden={status !== 'saving'}></div>
	<div class="absolute top-1" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{errorMessage}</span>
</div>
