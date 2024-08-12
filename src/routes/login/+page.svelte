<script lang="ts">
	import Google from '$lib/components/icons/Google.svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';

	let isLogin = true;
	export let data;

	function toggleMode() {
		isLogin = !isLogin;
	}
</script>

{#if data.user}
	<div class="flex h-screen items-center justify-center bg-base-200">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<p><strong>Email:</strong> {data.user.email}</p>
				<p><strong>User ID:</strong> {data.user.id}</p>
				<form method="POST" action="?/logout">
					<div class="form-control mt-6">
						<button class="btn btn-primary">Log out</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<div class="flex h-screen items-center justify-center bg-base-200">
		<div class="card w-96 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title justify-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
				<form method="post" action={isLogin ? ' ?/login' : '?/signup'}>
					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text">Email</span>
						</label>
						<input id="email" name="email" type="email" placeholder="email@example.com" class="input input-bordered" />
					</div>
					<div class="form-control mt-4">
						<label class="label" for="password">
							<span class="label-text">Password</span>
						</label>
						<input id="password" name="password" type="password" placeholder="••••••••" class="input input-bordered" />
					</div>
					<div class="form-control mt-6">
						<button class="btn btn-primary">{isLogin ? 'Login' : 'Sign Up'}</button>
					</div>
				</form>
				{#if isLogin}
					<div class="mt-2 text-center">
						<a href={null} class="link-hover link">Forgot password?</a>
					</div>
				{/if}
				<div class="divider">OR</div>
				<div class="flex flex-col gap-2">
					<form method="POST">
						<button formaction="?/login&provider=google" class="btn btn-outline">
							<Google />
							{isLogin ? 'Login' : 'Sign Up'} with Google
						</button>
						<button formaction="?/login&provider=github" class="btn btn-outline">
							<GitHub />
							{isLogin ? 'Login' : 'Sign Up'} with GitHub
						</button>
					</form>
				</div>
				<div class="mt-4 text-center">
					<span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
					<a href={null} class="link link-primary ml-1" on:click={toggleMode}>
						{isLogin ? 'Sign up' : 'Login'}
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

<pre>{JSON.stringify(data, null, 2)}</pre>