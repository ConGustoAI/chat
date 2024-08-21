<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIupsertKey } from '$lib/api';
	import { toLogin } from '$lib/stores/loginModal';
	import { assert } from '$lib/utils';
	import { Check, Trash2 } from 'lucide-svelte';
	import { dbUser } from '$lib/stores/appstate';

	export let apiKey: ApiKeyInterface;
	export let edit: boolean = false;
	export let deleteKey;
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
				if (!$dbUser) {
					toLogin();
					return;
				}
				APIupsertKey(apiKey)
					.then((res) => {
						status = 'saved';
						console.log('res', res);
						assert(!apiKey.id || res.id == apiKey.id, 'ID mismatch');
						apiKey.id = res.id;
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

<input
	type="text"
	class="input input-bordered"
	bind:value={apiKey.label}
	on:input={statusChanged}
	spellcheck="false"
	disabled={!edit} />
<input
	type="text"
	class="input input-bordered"
	bind:value={apiKey.key}
	on:input={statusChanged}
	spellcheck="false"
	disabled={!edit} />
<button
	class="btn btn-outline"
	disabled={!edit || status === 'deleting'}
	on:click={async () => {
		status = 'deleting';
		await deleteKey(apiKey);
		status = null;
	}}>
	<Trash2 />
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
