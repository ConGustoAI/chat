<script lang="ts">
	import { goto } from '$app/navigation';
	import { dbUser } from '$lib/stores/appstate';
	let logoutSpinning = false;
	let logoutAllSpinning = false;

	if (!dbUser) {
		goto('/login');
	}
</script>

<h2 class="card-title">Logged in as {$dbUser?.name}</h2>
<p><strong>Email:</strong> {$dbUser?.email}</p>
<p><strong>User ID:</strong> {$dbUser?.id}</p>
<div class="flex gap-4 mt-4">
	<form method="POST" action="?/logout">
		<button
			class="btn btn-outline text-xl"
			on:click={() => {
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
			on:click={() => {
				logoutAllSpinning = true;
			}}>
			{#if logoutAllSpinning}
				<div class="loading"></div>
			{/if}
			Log out on all devices
		</button>
	</form>
</div>
