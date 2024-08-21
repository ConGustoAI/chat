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
	let menu: HTMLUListElement;
</script>

<details class={cn('dropdown ', className)}>
	<summary class={cn('btn', disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<div class="loading loading-sm" />
		{:else}
			<Trash2 {size} />
		{/if}
	</summary>

	<ul bind:this={menu} class="menu dropdown-content z-[1] w-fit p-2">
		<li>
			<button
				class="btn btn-primary btn-sm text-nowrap rounded-md"
				on:click={async () => {
					menu.hidden = true;
					disabled = true;
					deleting = true;
					await deleteAction();
					disabled = false;
					deleting = false;
				}}>Yes, delete!</button>
		</li>
	</ul>
</details>
