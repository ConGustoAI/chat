<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { goto } from '$app/navigation';
	import { APIupsertKey } from '$lib/api';
	import { assert, fixNumberInput } from '$lib/utils/utils';
	import dbg from 'debug';
	import { Check } from 'lucide-svelte';
	const debug = dbg('app:lib:components:ApiKeyStatus');

	let { apiKey = $bindable(), provider }: { apiKey: ApiKeyInterface; provider: string } = $props();

	let status: 'changed' | 'saving' | 'saved' | 'error' | undefined = $state(undefined);
	let errorMessage: string | null = $state(null);
	let updateTimer: number | undefined | NodeJS.Timeout;

	async function updateKeyNow() {
		if (!A.dbUser) {
			goto('/login', { invalidateAll: true });
		}
		if (status !== 'changed') return;
		status = 'saving';
		const res = await APIupsertKey(apiKey)
			.then((res) => {
				assert(!apiKey.id || res.id == apiKey.id, 'API Key ID mismatch');
				apiKey.id = res.id;
				status = 'saved';
				updateTimer = setTimeout(() => {
					status = undefined;
				}, 2000);
			})
			.catch((e) => {
				status = 'error';
				errorMessage = e.message;
			});
		status = 'saved';
		Object.assign(apiKey, res);
	}

	function debounceKeyUpdate() {
		debug('debounceKeyUpdate');
		clearTimeout(updateTimer);
		updateTimer = setTimeout(updateKeyNow, 750);
	}
</script>

<div>{provider}/{apiKey.label}</div>

<input
	type="number"
	class="no-spinner input input-sm input-bordered w-fit"
	bind:value={apiKey.usage}
	onchange={(e) => {
		status = 'changed';
		fixNumberInput(e, 0, 99999);
		debounceKeyUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateKeyNow();
	}} />

<input
	type="number"
	class="no-spinner input input-sm input-bordered w-fit"
	bind:value={apiKey.remainder}
	oninput={(e) => {
		status = 'changed';
		fixNumberInput(e, 0, Infinity);
		debounceKeyUpdate();
	}}
	onblur={() => {
		clearTimeout(updateTimer);
		updateKeyNow();
	}} />
<div class="self-center">
	<div class="loading" class:hidden={status !== 'saving'}></div>
	<div class="" class:hidden={status !== 'saved'}>
		<Check />
	</div>
</div>

<div class="col-span-full text-error" class:hidden={status !== 'error'}>
	<span>{errorMessage}</span>
</div>
