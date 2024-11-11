<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { APIupsertKey } from '$lib/api';
	import { DeleteButton } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { assert } from '$lib/utils/utils';
	import { Check } from 'lucide-svelte';
	import dbg from 'debug';
	const debug = dbg('app:lib:components:ApiKey');

	let {
		apiKey = $bindable(),
		edit = false,
		deleteKey
	}: {
		apiKey: ApiKeyInterface;
		edit?: boolean;
		deleteKey: any;
	} = $props();

	let status: 'changed' | 'saving' | 'saved' | 'error' | 'deleting' | 'hiding' | 'copying' | null | undefined =
		$state(undefined);
	let errorMessage: string | null = $state(null);
	let updateTimer: number | undefined | NodeJS.Timeout = $state(undefined);

	// Don't let the user navigate off if changes are unsaved
	beforeNavigate((navigation) => {
		if (status && status != 'saved') {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				navigation.cancel();
			}
		}
	});

	function updateKeyNow() {
		if (!A.user) {
			goto('/login', { invalidateAll: true });
		}
		if (status !== 'changed') return;
		status = 'saving';
		return APIupsertKey(apiKey)
			.then((res) => {
				assert(!apiKey.id || res.id == apiKey.id, 'API Key ID mismatch');
				apiKey.id = res.id;
				status = 'saved';
				updateTimer = setTimeout(() => {
					status = null;
				}, 2000);
			})
			.catch((e) => {
				status = 'error';
				errorMessage = e.message;
			});
	}

	function debounceKeyUpdate() {
		debug('debounceKeyUpdate');
		clearTimeout(updateTimer);
		updateTimer = setTimeout(updateKeyNow, 750);
	}

	$inspect(status);
</script>

<input
	type="text"
	class="input input-bordered"
	bind:value={apiKey.label}
	oninput={() => {
		status = 'changed';
		debounceKeyUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateKeyNow();
	}}
	spellcheck="false"
	disabled={!edit || status === 'deleting'} />
<input
	type="text"
	class="input input-bordered"
	bind:value={apiKey.key}
	oninput={() => {
		status = 'changed';
		debounceKeyUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateKeyNow();
	}}
	spellcheck="false"
	disabled={!edit || status === 'deleting'} />

<DeleteButton
	class=""
	btnClass="btn btn-outline p-2 h-full w-full"
	deleteAction={async () => {
		status = 'deleting';
		await deleteKey(apiKey);
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
