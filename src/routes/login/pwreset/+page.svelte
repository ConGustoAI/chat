<script lang="ts">
	import { enhance } from '$app/forms';
	// import type { ActionData } from './$types';

	export let form;

	let password = '';
	let confirmPassword = '';
</script>

<div class="flex h-screen items-center justify-center bg-base-200">
	<div class="card w-96 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title justify-center">Reset Password</h2>
			<form method="POST" use:enhance>
				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">New Password</span>
					</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
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
						placeholder="••••••••"
						class="input input-bordered"
						required />
				</div>
				{#if password !== confirmPassword}
					<p class="mt-2 text-error">Passwords do not match</p>
				{/if}
				<div class="form-control mt-6">
					<button class="btn btn-primary" disabled={password !== confirmPassword}>Reset Password</button>
				</div>
				{#if form?.error}
					<div class="mt-4 text-error">{form.error}</div>
				{/if}
				{#if form?.success}
					<div class="mt-4 text-success">
						Password reset successfully. You can now <a href="/login" class="link link-primary">login</a> with your new password.
					</div>
				{/if}
			</form>
		</div>
	</div>
</div>
