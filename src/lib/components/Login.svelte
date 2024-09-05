<script lang="ts">
	import Google from '$lib/components/icons/Google.svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import { dbUser } from '$lib/stores/appstate';
	import { env } from '$env/dynamic/public';
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	export let formData;

	// This component is used by the modal login window, which is always present, and also by the login page
	// We need to de-conflict the element Ids.
	export let idPrefix = '';
	let isLogin = true;

	let EmailSpinning = false;
	let loginGoogleSpinning = false;
	let loginGithubSpinning = false;
	let logoutSpinning = false;
	let logoutAllSpinning = false;

	function toggleMode() {
		isLogin = !isLogin;
	}

	$: console.log({ form: formData });
</script>

{#if $dbUser}
	<h2 class="card-title justify-center">Welcome, {$dbUser.name}</h2>
	<p><strong>Email:</strong> {$dbUser.email}</p>
	<p><strong>User ID:</strong> {$dbUser.id}</p>
	<div class="flex gap-4">
		<form method="POST" action="/login?/signout" use:enhance>
			<button
				class="btn btn-outline"
				on:click={() => {
					logoutSpinning = true;
				}}>
				{#if logoutSpinning}
					<div class="loading"></div>
				{/if}
				Log out
			</button>
		</form>
		<form method="POST" action="/login?/signoutAll">
			<button
				class="btn btn-outline"
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
{:else if formData?.verify}
	<div>
		<h2 class="card-title justify-center">
			Verification email sent to {formData?.email}
		</h2>
		<p>Please check your inbox and follow the link</p>

		<button
			class="btn btn-outline mt-4"
			on:click={() => {
				formData.verify = false;
			}}>
			Ok
		</button>
	</div>
{:else}
	<h2 class="card-title justify-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
	{#if !env.PUBLIC_DISABLE_EMAIL_LOGIN}
		<form
			method="POST"
			action={isLogin ? '/api/login?/login' : '/api/login?/signup'}
			use:enhance={() => {
				return async ({ result }) => {
					EmailSpinning = false;
					if (result.type === 'redirect') {
						window.location.href = result.location;
					} else {
						console.log('applyAction', result);
						await applyAction(result);
					}
				};
			}}>
			<div class="form-control">
				<label class="label" for="{idPrefix}email">
					<span class="label-text">Email</span>
				</label>
				<input
					id="{idPrefix}email"
					name="email"
					type="email"
					placeholder="email@example.com"
					autocomplete="email"
					value={formData?.email ?? ''}
					class="input input-bordered" />
				{#if formData?.emailmissing}<p class="text-error">The email field is required</p>{/if}
			</div>
			<div class="form-control mt-4">
				<label class="label" for="{idPrefix}password">
					<span class="label-text">Password</span>
				</label>
				<input
					id="{idPrefix}password"
					name="password"
					type="password"
					placeholder="••••••••"
					autocomplete={isLogin ? 'current-password' : 'new-password'}
					class="input input-bordered bg-base-300" />
				{#if formData?.pwmissing}<p class="text-error">The password field is required</p>{/if}
			</div>
			<div class="form-control mt-6">
				<button
					class="btn btn-outline"
					on:click={() => {
						EmailSpinning = true;
					}}>
					{#if EmailSpinning}
						<div class="loading"></div>
					{/if}
					{isLogin ? 'Login' : 'Sign Up'}
				</button>
			</div>
			{#if formData?.error}
				<div class="text-error">{formData?.error}</div>
			{/if}
			{#if isLogin}
				<div class="mt-2 text-center">
					<button
						formaction="/login?/recover"
						class="link-hover link"
						on:click={() => {
							// Add spinner logic if needed
						}}>
						Forgot password?
					</button>
				</div>
			{/if}
			<div class="mt-4 text-center">
				<span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
				<a href={null} class="link ml-1" on:click={toggleMode}>
					{isLogin ? 'Sign up' : 'Login'}
				</a>
			</div>
		</form>
	{/if}

	{#if !env.PUBLIC_DISABLE_EMAIL_LOGIN && (!env.PUBLIC_DISABLE_GOOGLE_LOGIN || !env.PUBLIC_DISABLE_GITHUB_LOGIN)}
		<div class="divider">OR</div>
	{/if}
	<form method="POST">
		<div class="flex flex-col gap-2">
			{#if !env.PUBLIC_DISABLE_GOOGLE_LOGIN}
				<button
					formaction="/login?/login&provider=google"
					class="btn btn-outline"
					on:click={() => {
						loginGoogleSpinning = true;
					}}>
					{#if loginGoogleSpinning}
						<div class="loading"></div>
					{:else}
						<Google />
					{/if}
					{isLogin ? 'Log in' : 'Sign Up'} with Google
				</button>
			{/if}
			{#if !env.PUBLIC_DISABLE_GITHUB_LOGIN}
				<button
					formaction="/login/?/login&provider=github"
					class="btn btn-outline"
					on:click={() => {
						loginGithubSpinning = true;
					}}>
					{#if loginGithubSpinning}
						<div class="loading"></div>
					{:else}
						<GitHub />
					{/if}
					{isLogin ? 'Log in' : 'Sign Up'} with GitHub
				</button>
			{/if}

			{#if env.PUBLIC_DISABLE_EMAIL_LOGIN && env.PUBLIC_DISABLE_GOOGLE_LOGIN && env.PUBLIC_DISABLE_GITHUB_LOGIN}
				<div class="text-center">
					<p>No login methods available.</p>
					<p>Please contact the Admin.</p>
				</div>
			{/if}
		</div>
		{#if formData?.providererror}
			<div class="text-error">{formData?.providererror}</div>
		{/if}
	</form>
{/if}
