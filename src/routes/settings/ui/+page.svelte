<script lang="ts">
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	import { mode, theme, setTheme } from 'mode-watcher';
	import { toggleMode } from 'mode-watcher';
	import { A } from '$lib/appstate.svelte';
	import { APIupdateUser } from '$lib/api';

	function cycleTheme() {
		toggleMode();
		const theme = $mode === 'dark' ? 'dark' : 'light';
		setTheme(theme);
		document.documentElement.setAttribute('data-theme', theme);
	}

	let updatingUser = $state(false);
	async function updateUserData() {
		if (!A.dbUser) throw new Error('No user');
		updatingUser = true;
		try {
			const newData = await APIupdateUser($state.snapshot(A.dbUser!));
			Object.assign(A.dbUser, newData);
		} finally {
			updatingUser = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="grid w-fit grid-cols-[max-content,auto,2rem,4rem,2rem] gap-2">
		<div class="label-text">Dark mode</div>
		<div></div>
		<Sun />
		<input type="checkbox" checked={$theme === 'dark'} onclick={cycleTheme} class="theme-controller toggle" />
		<Moon />

		{#if A.dbUser}
			<span class="label-text">Advanced Input</span>
			<div></div>
			<div></div>
			<input
				type="checkbox"
				class="toggle"
				bind:checked={A.dbUser.advancedInput}
				disabled={updatingUser}
				onchange={updateUserData} />
			{#if updatingUser}
				<div class="loading loading-sm"></div>
			{:else}
				<div></div>
			{/if}
		{/if}
	</div>

	{#if A.dbUser?.advancedInput}
		<div
			class="col-span-full grid w-fit grid-cols-[max-content,max-content] items-baseline gap-2 rounded-md border border-primary-content px-1 py-1">
			<kbd class="kbd kbd-sm w-fit rounded-md px-1 py-1">Enter</kbd>
			<div>Add a new line to the current message</div>
			<kbd class="kbd kbd-sm w-fit rounded-md px-1 py-1">Shift + Enter</kbd>
			<div>Add a user message</div>
			<kbd class="kbd kbd-sm w-fit rounded-md px-1 py-1">Ctrl + Shift + Enter</kbd>
			<div>Add an assistant message</div>
			<kbd class="kbd kbd-sm w-fit rounded-md px-1 py-1">Ctrl + Enter</kbd>
			<div>Send the message</div>
		</div>
	{:else}
		<div
			class="col-span-full grid w-fit grid-cols-[max-content,max-content] items-baseline gap-2 rounded-md border border-primary-content px-1 py-1">
			<kbd class="kbd kbd-sm w-fit rounded-md px-1 py-1">Enter</kbd>
			<div>Send the message</div>
			<kbd class="kbd kbd-sm w-fit rounded-md px-1 py-1">Shift + Enter</kbd>
			<div>Add a new line to the message</div>
		</div>
	{/if}
</div>