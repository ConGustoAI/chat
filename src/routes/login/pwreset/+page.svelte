<script lang="ts">
	import { enhance } from '$app/forms';

	export let form;

	let password = '';
	let confirmPassword = '';
</script>

<div class="card-body">
	<h2 class="card-title justify-center">Reset Password</h2>
	<form
		method="POST"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update({ invalidateAll: true });
			};
		}}>
		<div class="form-control">
			<label class="label" for="password">
				<span class="label-text">New Password</span>
			</label>
			<input
				id="password"
				name="password"
				type="password"
				bind:value={password}
				class="input input-bordered"
				required />
		</div>
		<div class="form-control mt-4">
			<label class="label" for="confirmPassword">
				<span class="label-text">Confirm New Password</span>
			</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				class="input input-bordered"
				required />
		</div>
		{#if password !== confirmPassword}
			<p class="mt-2 text-error">Passwords do not match</p>
		{/if}
		<div class="form-control mt-6">
			<button class="btn btn-outline" disabled={password !== confirmPassword}>Reset Password</button>
		</div>
		{#if form?.error}
			<div class="mt-4 text-error">{form.error}</div>
		{/if}
	</form>
</div>
