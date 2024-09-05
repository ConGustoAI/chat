<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="card card-normal">
		<h2 class="card-title">
			Verification email sent to {$page.url.searchParams.get('email') ?? 'Unknown email??'}
		</h2>
		<p class="">Please check your inbox and follow the link</p>

		<div class="card-actioins">
			<a href="/login" class="btn btn-outline mt-4 w-fit"> Ok </a>
		</div>
	</div>
</div>
