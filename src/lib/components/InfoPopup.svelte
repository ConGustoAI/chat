<script lang="ts">
	import { Info } from 'lucide-svelte';

	export let title: string;
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-circle btn-ghost btn-xs text-info">
		<Info tabindex={0} class="h-4 w-4 stroke-current" />
	</div>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<div tabindex="0" class="card dropdown-content compact z-[1] w-fit rounded-box bg-base-100 shadow">
		<div tabindex="0" class="card-body">
			<h2 class="card-title text-nowrap">{title}</h2>
			<slot />
		</div>
	</div>
</div>
