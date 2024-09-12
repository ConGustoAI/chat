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
	let button: HTMLButtonElement;
</script>

<div class={cn('dropdown', className)}>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<div tabindex={0} class={cn(disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<div class="loading loading-sm" />
			<slot />
		{:else}
			<Trash2 {size} />
			<slot />
		{/if}
	</div>

	<ul class="dropdown-content w-fit p-2">
		<li>
			<button
				bind:this={button}
				class="btn btn-sm z-10 btn-outline text-nowrap rounded-md"
				on:click={async () => {
					disabled = true;
					deleting = true;
					button.blur();
					await deleteAction();
					disabled = false;
					deleting = false;
				}}>Yes, delete!</button>
		</li>
	</ul>
</div>
