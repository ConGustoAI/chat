<script lang="ts">
	import { cn } from '$lib/utils/utils';
import { Info } from 'lucide-svelte';

	let { class: clas,  title, children }: { class?: string, title: string, children?: any } = $props();
</script>

<div class={cn("dropdown dropdown-end", clas)}>
	<div tabindex="0" role="button" class="btn btn-circle btn-ghost btn-xs text-info">
		<Info tabindex={0} class="h-4 w-4 stroke-current" />
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div tabindex="0" class="card dropdown-content compact z-[1] w-fit rounded-box bg-base-300 shadow">
		<div tabindex="0" class="card-body min-w-96">
			<h2 class="card-title text-nowrap">{title}</h2>
			{@render children?.()}
		</div>
	</div>
</div>
