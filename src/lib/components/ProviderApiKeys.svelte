<script lang="ts">
	import { Trash2, Check } from 'lucide-svelte';
	import { upsertProvider, upsertKey, deleteProvider, deleteKey } from '$lib/api-client.js';
	import { beforeNavigate } from '$app/navigation';

	export let apiKey: KeyInterface;
	export let onDeleteKey;
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

	function debounceKeysUpdate() {
		if (status === 'changed') {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(() => {
				status = 'saving';
				upsertKey(apiKey)
					.then((res) => {
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
		debounceKeysUpdate();
		hasUnsavedChanges = !!(status && status != 'saved');
	}
</script>

<input type="text" class="input input-bordered" bind:value={apiKey.label} on:input={statusChanged} spellcheck="false" />
<input type="text" class="input input-bordered" bind:value={apiKey.key} on:input={statusChanged} spellcheck="false" />
<button
	class="btn btn-outline col-span-1"
	on:click={() => {
		status = 'saving';
		onDeleteKey();
	}}>
	<Trash2 />
</button>
<div class="relative size-full self-center">
	<!-- <div class="absolute">{provider.status}</div> -->
	<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
	<div class="absolute" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>
<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{errorMessage}</span>
</div>
