<script lang="ts">
	import { goto } from '$app/navigation';
	import { APIupdateUser } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import { UserCircle } from 'lucide-svelte';

	async function setHacker() {
		if (!A.user) return;
		try {
			A.user = await APIupdateUser({ id: A.user.id, hacker: A.user.hacker });
		} catch (e) {
			console.error('Failed to update A.user', e);
			A.user.hacker = !A.user.hacker;
		}
	}

	async function gotoSettings() {
		await goto('/settings');
	}
</script>

<div class="dropdown dropdown-left">
	<div tabindex="0" role="button">
		{#if A.user?.avatar}
			<div class="p-auto avatar m-auto align-middle">
				<div class="bordered w-6 rounded-xl">
					<!-- https://stackoverflow.com/questions/40570117/http403-forbidden-error-when-trying-to-load-img-src-with-google-profile-pic -->
					<img src={A.user.avatar} referrerpolicy="no-referrer" alt="User avatar" />
				</div>
			</div>
		{:else}
			<UserCircle />
		{/if}
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ul tabindex="0" class="menu dropdown-content z-[1] bg-base-200 p-2">
		<button class="btn btn-primary btn-sm justify-start text-nowrap" onclick={gotoSettings}>Settings</button>

		{#if A.user}
			<div class="btn btn-primary btn-sm flex flex-nowrap items-center gap-2">
				Hacker
				<input type="checkbox" class="toggle" bind:checked={A.user.hacker} onchange={setHacker} name="hacker" />
			</div>
		{/if}

		<a class="btn btn-primary btn-sm justify-start text-nowrap" href={A.user ? '/login/logout' : '/login'}>
			{#if A.user}Log out{:else}Log in{/if}
		</a>
	</ul>
</div>
