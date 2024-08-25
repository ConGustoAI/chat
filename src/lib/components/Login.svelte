<script lang="ts">
	import Google from '$lib/components/icons/Google.svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';
	import { dbUser } from '$lib/stores/appstate';
	import { env } from '$env/dynamic/public';

	let isLogin = true;
	export let form;

	let loginSpinning = false;
	let signupSpinning = false;
	let loginGoogleSpinning = false;
	let loginGithubSpinning = false;
	let logoutSpinning = false;
	let logoutAllSpinning = false;

	function toggleMode() {
		isLogin = !isLogin;
	}
</script>

{#if $dbUser}
	<h2 class="card-title justify-center">Welcome, {$dbUser.name}</h2>
	<p><strong>Email:</strong> {$dbUser.email}</p>
	<p><strong>User ID:</strong> {$dbUser.id}</p>
	<div class="flex gap-4">
		<form method="POST" action="/api/login?/signout">
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
		<form method="POST" action="/api/login?/signoutAll">
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
{:else}
	<h2 class="card-title justify-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
	{#if !env.PUBLIC_DISABLE_EMAIL_LOGIN}
		<form method="post" action={isLogin ? '/api/login?/login' : '/api/login?/signup'}>
			<div class="form-control">
				<label class="label" for="email">
					<span class="label-text">Email</span>
				</label>
				<input
					id="email"
					name="email"
					type="email"
					placeholder="email@example.com"
					class="input input-bordered input-primary" />
				{#if form?.emailmissing}<p class="text-error">The email field is required</p>{/if}
			</div>
			<div class="form-control mt-4">
				<label class="label" for="password">
					<span class="label-text">Password</span>
				</label>
				<input id="password" name="password" type="password" placeholder="••••••••" class="bg-base-300 input input-bordered" />
				{#if form?.incorrect}<p class="text-error">Invalid credentials!</p>{/if}
				{#if form?.pwmissing}<p class="text-error">The password field is required</p>{/if}
			</div>
			<div class="form-control mt-6">
				<button
					class="btn btn-outline"
					on:click={() => {
						isLogin ? (loginSpinning = true) : (signupSpinning = true);
					}}>
					{#if isLogin ? loginSpinning : signupSpinning}
						<div class="loading"></div>
					{/if}
					{isLogin ? 'Login' : 'Sign Up'}
				</button>
			</div>
			{#if form?.error}
				<div class="text-error">{form.error}</div>
			{/if}
			{#if isLogin}
				<div class="mt-2 text-center">
					<button
						formaction="/api/login?/recover"
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
				<a href={null} class="link link-primary ml-1" on:click={toggleMode}>
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
					formaction="/api/login?/login&provider=google"
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
					formaction="/api/login/?/login&provider=github"
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
		{#if form?.providererror}
			<div class="text-error">{form.providererror}</div>
		{/if}
	</form>
{/if}
