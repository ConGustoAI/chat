<script lang="ts">
	import { goto } from '$app/navigation';
	import { A } from '$lib/appstate.svelte';
	let logoutSpinning = $state(false);
	let logoutAllSpinning = $state(false);

	if (!A.dbUser) {
		goto('/login');
	}
</script>

<h2 class="card-title">Logged in as {A.dbUser?.name}</h2>
<p><strong>Email:</strong> {A.dbUser?.email}</p>
<p><strong>User ID:</strong> {A.dbUser?.id}</p>
<div class="flex gap-4 mt-4">
	<form method="POST" action="?/logout">
		<button
			class="btn btn-outline text-xl"
			onclick={() => {
				logoutSpinning = true;
			}}>
			{#if logoutSpinning}
				<div class="loading"></div>
			{/if}
			Log out
		</button>
	</form>
	<form method="POST" action="?/logoutAll">
		<button
			class="btn btn-outline text-xl"
			onclick={() => {
				logoutAllSpinning = true;
			}}>
			{#if logoutAllSpinning}
				<div class="loading"></div>
			{/if}
			Log out on all devices
		</button>
	</form>
</div>
