<script lang="ts">
	import { cn } from '$lib/utils';
	import { Trash2 } from 'lucide-svelte';

	export let deleteAction: () => void;
	export let size = 15;
	export let btnClass = '';
	let className = '';
	export { className as class };
</script>

<div class={cn('dropdown', className)}>
	<div tabindex="0" role="button" class={cn('btn', btnClass)}>
		<Trash2 {size} />
	</div>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<ul tabindex="0" class="menu dropdown-content z-[1] w-fit p-2">
		<li>
			<button class="btn btn-primary btn-sm text-nowrap rounded-md" on:click={deleteAction}>Yes, delete!</button>
		</li>
	</ul>
</div>

<!-- <button
	class="btn btn-ghost btn-xs rounded-md p-0 px-1"
	on:click={() => {
		deleteMessage();
	}}><Trash2 size={15} /></button> -->
