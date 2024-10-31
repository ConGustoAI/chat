<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIfetchAssistants, APIupdateUser } from '$lib/api';
	import GrowInput from '$lib/components/GrowInput.svelte';
	import { Check } from 'lucide-svelte';
	import { onMount, untrack } from 'svelte';
	import { A } from '$lib/appstate.svelte';
	import { defaultsUUID } from '$lib/db/schema';

	import dbg from 'debug';
	import ApiKeyStats from '$lib/components/settings/ApiKeyStats.svelte';
	const debug = dbg('app:ui:settings:page');

	let status: string | null = $state(null);
	let statusMessage: string | null = $state(null);
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

	$effect(() => {
		debounceUserUpdate();
		hasUnsavedChanges = !!(status && status != 'saved');
	});

	function debounceUserUpdate() {
		if (!A.dbUser) {
			status = null;
			return;
		}

		if (status === 'changed') {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(() => {
				status = 'saving';
				APIupdateUser($state.snapshot(A.dbUser!))
					.then(() => {
						status = 'saved';
						updateTimer = setTimeout(() => {
							status = null;
						}, 2000);
					})
					.catch((e) => {
						status = 'error';
						statusMessage = e.message;
					});
			}, 750);
		}
	}

	function statusChanged() {
		debug('statusChanged, previously', $state.snapshot(status));
		status = 'changed';
	}
</script>

{#if A.dbUser}
	<section class="flex max-w-screen-md flex-col gap-2">
		<div class="flex items-end gap-4">
			<div class="flex flex-col gap-4">
				<h2 class="text-2xl font-bold">User Profile</h2>
				<p>{A.dbUser.email}</p>
				<p class="btn btn-disabled btn-outline" data-sveltekit-reload>Change Password</p>
			</div>
			<div class="relative self-start">
				<div class="loading absolute top-1" class:hidden={status !== 'saving'}></div>
				<div class="absolute" class:hidden={status !== 'saved'}>
					<Check />
				</div>
			</div>
			{#if status === 'error'}
				<span class="text-error">{statusMessage}</span>
			{/if}
		</div>

		<div class="flex gap-4">
			<div class="flex flex-col">
				<span class="text-sm">Name</span>
				<input
					type="text"
					class="input input-bordered w-full"
					bind:value={A.dbUser.name}
					oninput={statusChanged}
					spellcheck="false" />
			</div>

			<label class="flex flex-col">
				<span class="text-sm">Default Assistant</span>
				<select class="select select-bordered w-full" bind:value={A.dbUser.assistant} onchange={statusChanged}>
					<option value={defaultsUUID}>Last one used</option>
					{#each Object.values(A.assistants) as assistant}
						<option value={assistant.id}>{assistant.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="divider w-full">Information for the Assistant</div>
		<div class="flex flex-col">
			<span class="text-sm">About you</span>
			<GrowInput
				class="textarea-bordered whitespace-pre-wrap text-wrap"
				bind:value={A.dbUser.aboutUser}
				oninput={statusChanged} />
		</div>

		<div class="flex flex-col">
			<span class="text-sm">Instructions</span>
			<GrowInput
				class="textarea-bordered whitespace-pre-wrap text-wrap"
				bind:value={A.dbUser.assistantInstructions}
				oninput={statusChanged} />
		</div>

		<div class="divider w-full">Message Information</div>

		<div
			class="grid w-full grid-cols-[max-content,max-content,max-content,max-content,max-content] items-center gap-4 gap-y-2">
			<div class="flex items-center">Token estimate</div>
			<div class="flex items-center">Message info</div>
			<div class="flex items-center">Show cost above</div>
			<div class="flex items-center text-warning">Show cost above</div>
			<div class="flex items-center text-error">Show cost above</div>

			<input type="checkbox" class="checkbox" bind:checked={A.dbUser.showEstimate} onchange={statusChanged} />
			<input type="checkbox" class="checkbox" bind:checked={A.dbUser.showInfo} onchange={statusChanged} />

			<input
				type="number"
				class="input input-sm input-bordered w-32"
				bind:value={A.dbUser.costShow}
				oninput={statusChanged}
				min="0"
				step="0.01" />
			<input
				type="number"
				class="input input-sm input-bordered w-32"
				bind:value={A.dbUser.costWarn1}
				oninput={statusChanged}
				min="0"
				step="0.01" />
			<input
				type="number"
				class="input input-sm input-bordered w-32"
				bind:value={A.dbUser.costWarn2}
				oninput={statusChanged}
				min="0"
				step="0.01" />
		</div>

		<div class="flex w-fit flex-col">
			<div class="divider w-full">Ussage statistics</div>
			<div class="grid grid-cols-[auto,max-content,max-content,4rem] items-center gap-4 gap-y-2">
				<div class="font-bold">API Key</div>
				<div class="font-bold">Usage</div>
				<div class="font-bold">Remainder</div>
				<div></div>

				{#each Object.values(A.providers).toSorted((a, b) => a.name.localeCompare(b.name)) as p}
					{#each Object.values(A.apiKeys).toSorted((a, b) => a.label.localeCompare(b.label)) as k}
						{#if k.providerID === p.id}
							<ApiKeyStats provider={p.name} bind:apiKey={A.apiKeys[k.id!]} />
						{/if}
					{/each}
				{/each}
			</div>
		</div>
	</section>
{:else}
	<a class="btn btn-outline" href="/login">Log in</a>
{/if}
