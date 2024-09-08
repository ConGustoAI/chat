<script lang="ts">
	// import { Notification } from '$lib/components';

	// import { applyAction, enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import { dbUser } from '$lib/stores/appstate';
	import { goto } from '$app/navigation';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import Google from '$lib/components/icons/Google.svelte';

	export let form;
	$: console.log({ form });

	if ($dbUser) {
		goto('/login/logout', { invalidateAll: true });
	}

	let isLogin = true;

	// let EmailSpinning = false;
	let loginGoogleSpinning = false;
	let loginGithubSpinning = false;

	function toggleMode() {
		isLogin = !isLogin;
	}
</script>

<h2 class="card-title justify-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
<!-- {#if !env.PUBLIC_DISABLE_EMAIL_LOGIN}
	<form
		method="POST"
		action={isLogin ? '?/loginEmail' : '?/signup'}
		use:enhance={() => {
			return async ({ result }) => {
				EmailSpinning = false;
				if (result.type === 'redirect') {
					goto(result.location, { invalidateAll: true });
				}
				await applyAction(result);
			};
		}}>
		<div class="flex flex-col">
			<label class="label" for="email">
				<span class="label-text">Email</span>
			</label>
			<input
				id="email"
				name="email"
				type="email"
				placeholder="email@example.com"
				autocomplete="email"
				value={form?.email ?? ''}
				class="input input-bordered" />
			{#if form?.emailMissing}
				<Notification messageType="error" bind:message={form.emailMissing} />
			{/if}
		</div>
		<div class="mt-4 flex flex-col">
			<label class="label" for="password">
				<span class="label-text">Password</span>
			</label>
			<input
				id="password"
				name="password"
				value={form?.password ?? ''}
				class="input input-bordered"
				type="password"
				autocomplete={isLogin ? 'current-password' : 'new-password'} />
			{#if form?.pwresetError}
				<Notification messageType="error" bind:message={form.pwresetError} />
			{/if}
		</div>
		{#if form?.emailError}
			<Notification messageType="error" bind:message={form.emailError} />
		{/if}
		<div class="mt-6 flex flex-col">
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
		{#if isLogin}
			<div class="mt-2 text-center">
				<button formaction="?/recover" class="link-hover link"> Forgot password? </button>
			</div>
			{#if form?.pwresetSent}
				<Notification messageType="success" bind:message={form.pwresetSent} />
			{/if}
			{#if form?.pwresetError}
				<button
					class="mt-2 text-center text-error"
					on:click={() => {
						if (form) form.pwresetError = '';
					}}>{form?.pwresetError}</button>
			{/if}
		{/if}
		<div class="mt-4 text-center">
			<span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
			<a href={null} class="link ml-1" on:click={toggleMode}>
				{isLogin ? 'Sign up' : 'Login'}
			</a>
		</div>
	</form>
{/if} -->

{#if !env.PUBLIC_DISABLE_EMAIL_LOGIN && (!env.PUBLIC_DISABLE_GOOGLE_LOGIN || !env.PUBLIC_DISABLE_GITHUB_LOGIN)}
	<div class="divider">OR</div>
{/if}
<form method="POST" action="?/loginProvider">
	<div class="flex flex-col gap-2">
		{#if !env.PUBLIC_DISABLE_GOOGLE_LOGIN}
			<button
				formaction="?/google"
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
				formaction="?/github"
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
</form>
