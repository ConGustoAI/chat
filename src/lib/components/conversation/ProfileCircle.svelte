<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIupdateUser } from '$lib/api';
	import { dbUser } from '$lib/stores/appstate';
	import { UserCircle } from 'lucide-svelte';

	async function setHacker() {
		if (!$dbUser) return;
		try {
			$dbUser = await APIupdateUser({ id: $dbUser.id, hacker: $dbUser.hacker });
		} catch (e) {
			console.error('Failed to update $dbUser', e);
			$dbUser.hacker = !$dbUser.hacker;
		}
	}

	async function gotoSettings() {
		await goto('/settings');
	}
</script>

<div class="dropdown dropdown-left">
	<div tabindex="0" role="button">
		{#if $dbUser?.avatar}
			<div class="p-auto avatar m-auto align-middle">
				<div class="bordered w-6 rounded-xl">
					<!-- https://stackoverflow.com/questions/40570117/http403-forbidden-error-when-trying-to-load-img-src-with-google-profile-pic -->
					<img src={$dbUser.avatar} referrerpolicy="no-referrer" alt="User avatar" />
				</div>
			</div>
		{:else}
			<UserCircle />
		{/if}
	</div>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<ul tabindex="0" class="menu dropdown-content z-[1] bg-base-200 p-2">
		<button class="btn btn-primary btn-sm justify-start text-nowrap" on:click={gotoSettings}>Settings</button>

		{#if $dbUser}
			<div class="btn btn-primary btn-sm flex flex-nowrap items-center gap-2">
				Hacker
				<input type="checkbox" class="toggle" bind:checked={$dbUser.hacker} on:change={setHacker} />
			</div>
		{/if}

		<a class="btn btn-primary btn-sm justify-start text-nowrap" href={$dbUser ? '/login/logout' : '/login'}>
			{#if $dbUser}Log out{:else}Log in{/if}
		</a>
	</ul>
</div>
