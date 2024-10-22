<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIupdateUser } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { UserCircle } from 'lucide-svelte';

	async function setHacker() {
		if (!A.dbUser) return;
		try {
			A.dbUser = await APIupdateUser({ id: A.dbUser.id, hacker: A.dbUser.hacker });
		} catch (e) {
			console.error('Failed to update A.dbUser', e);
			A.dbUser.hacker = !A.dbUser.hacker;
		}
	}

	async function gotoSettings() {
		await goto('/settings');
	}
</script>

<div class="dropdown dropdown-left">
	<div tabindex="0" role="button">
		{#if A.dbUser?.avatar}
			<div class="p-auto avatar m-auto align-middle">
				<div class="bordered w-6 rounded-xl">
					<!-- https://stackoverflow.com/questions/40570117/http403-forbidden-error-when-trying-to-load-img-src-with-google-profile-pic -->
					<img src={A.dbUser.avatar} referrerpolicy="no-referrer" alt="User avatar" />
				</div>
			</div>
		{:else}
			<UserCircle />
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul tabindex="0" class="menu dropdown-content z-[1] bg-base-200 p-2">
		<button class="btn btn-primary btn-sm justify-start text-nowrap" onclick={gotoSettings}>Settings</button>

		{#if A.dbUser}
			<div class="btn btn-primary btn-sm flex flex-nowrap items-center gap-2">
				Hacker
				<input type="checkbox" class="toggle" bind:checked={A.dbUser.hacker} onchange={setHacker} name="hacker" />
			</div>
		{/if}

		<a class="btn btn-primary btn-sm justify-start text-nowrap" href={A.dbUser ? '/login/logout' : '/login'}>
			{#if A.dbUser}Log out{:else}Log in{/if}
		</a>
	</ul>
</div>
