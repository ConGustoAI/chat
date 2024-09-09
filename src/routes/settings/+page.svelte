<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { APIfetchAssistants, APIupdateUser } from '$lib/api';
	import GrowInput from '$lib/components/GrowInput.svelte';
	import { Check } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { dbUser } from '$lib/stores/appstate';
	import { defaultsUUID } from '$lib/db/schema';

	let assistants: AssistantInterface[] = [];

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

	onMount(async () => {
		assistants = await APIfetchAssistants();
	});

	$: {
		debounceUserUpdate();
		hasUnsavedChanges = !!(status && status != 'saved');
	}

	function debounceUserUpdate() {
		if (status === 'changed') {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(() => {
				status = 'saving';
				APIupdateUser($dbUser!)
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
		status = 'changed';
	}
</script>

{#if $dbUser}
	<section class="flex max-w-screen-md flex-col gap-2">
		<div class="flex items-end gap-4">
			<div class="flex flex-col gap-4">
				<h2 class="text-2xl font-bold">User Profile</h2>
				<p>{$dbUser.email}</p>
				<a class="btn btn-outline" href="/login/pwreset" data-sveltekit-reload>Change Password</a>
			</div>
			<div class="relative self-start">
				<div class="loading absolute top-1" class:hidden={status !== 'saving'} />
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
					bind:value={$dbUser.name}
					on:input={statusChanged}
					spellcheck="false" />
			</div>

			<label class="flex flex-col">
				<span class="text-sm">Default Assistant</span>
				<select class="select select-bordered w-full" bind:value={$dbUser.assistant} on:change={statusChanged}>
					<option value={defaultsUUID}>Last one used</option>
					{#each assistants as assistant}
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
				bind:value={$dbUser.aboutUser}
				on:input={statusChanged} />
		</div>

		<div class="flex flex-col">
			<span class="text-sm">Instructions</span>
			<GrowInput
				class="textarea-bordered whitespace-pre-wrap text-wrap"
				bind:value={$dbUser.assistantInstructions}
				on:input={statusChanged} />
		</div>
	</section>
{/if}
