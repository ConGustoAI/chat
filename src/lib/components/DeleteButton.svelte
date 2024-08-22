<script lang="ts">
	import { cn } from '$lib/utils';
	import { Trash2 } from 'lucide-svelte';

	export let deleteAction: () => Promise<void> | void;
	export let size = 15;
	export let btnClass = '';
	let className = '';
	export { className as class };

	export let disabled = false;
	let deleting = false;
	let details: HTMLElement;
</script>

<div class={cn('dropdown', className)}>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<div tabindex={0} class={cn('inline-flex', disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<div class="loading loading-sm inline" />
		{:else}
			<Trash2 {size} />
		{/if}
	</div>

	<ul bind:this={details} class="menu dropdown-content z-20 w-fit p-2">
		<li>
			<button
				class="btn btn-primary btn-sm text-nowrap rounded-md"
				on:click={async () => {
					disabled = true;
					deleting = true;
					details.style.visibility = 'hidden';
					await deleteAction();
					disabled = false;
					deleting = false;
				}}>Yes, delete!</button>
		</li>
	</ul>
</div>
