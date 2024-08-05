<script lang="ts">
	import Google from '$lib/components/icons/Google.svelte';
	import GitHub from '$lib/components/icons/GitHub.svelte';

	let isLogin = true;

	function toggleMode() {
		isLogin = !isLogin;
	}
</script>

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
				<button class="btn btn-outline">
					<Google />
					{isLogin ? 'Login' : 'Sign Up'} with Google
				</button>
				<button class="btn btn-outline">
					<GitHub />
					{isLogin ? 'Login' : 'Sign Up'} with GitHub
				</button>
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
