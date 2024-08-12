<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { fetchUser, updateUser, fetchAssistants } from '$lib/api';
	import { Check } from 'lucide-svelte';

	export let data;
	let user: UserInterface | undefined;
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
		[user, assistants] = await Promise.all([fetchUser(), fetchAssistants()]);
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
				updateUser(user!)
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

{#if user}
	<section class="flex max-w-screen-md flex-col gap-2">
		<div class="flex items-end gap-4">
			<div class="flex flex-row items-end gap-4">
				<h2 class="text-2xl font-bold">User Profile</h2>
				<p>{user.email}</p>
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
			<label class="flex flex-col">
				<span class="label label-text">Name</span>
				<input
					type="text"
					class="input input-bordered w-full"
					bind:value={user.name}
					on:input={statusChanged}
					spellcheck="false" />
			</label>

			<label class="flex flex-col">
				<span class="label label-text">Default Assistant</span>
				<select class="select select-bordered w-full" bind:value={user.assistant} on:change={statusChanged}>
					{#each assistants as assistant}
						<option value={assistant.id}>{assistant.name}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="divider w-full">Information for the Assistant</div>
		<label class="flex flex-col">
			<span class="label label-text">About you</span>
			<textarea
				class="textarea textarea-bordered h-24 w-full"
				bind:value={user.aboutUser}
				on:input={statusChanged}
				spellcheck="false"></textarea>
		</label>

		<label class="flex flex-col">
			<span class="label label-text">Instructions</span>
			<textarea
				class="textarea textarea-bordered h-24 w-full"
				bind:value={user.assistantInstructions}
				on:input={statusChanged}
				spellcheck="false"></textarea>
		</label>
	</section>
{/if}
<pre>{JSON.stringify(data, null, 2)}</pre>
