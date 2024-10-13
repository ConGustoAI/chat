<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { Trash2 } from 'lucide-svelte';

	let { deleteAction, size = 15, btnClass = '', class: className = '', disabled = false, children } = $props<{
		deleteAction: () => Promise<void> | void;
		size?: number;
		btnClass?: string;
		class?: string;
		disabled?: boolean;
		children?: any;
	}>();

	let deleting = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
</script>

<div class={cn('dropdown', className)}>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div tabindex={0} class={cn(disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<!-- svelte-ignore slot_element_deprecated -->
			<div class="loading loading-sm"></div>
			{@render children?.()}
		{:else}
			<Trash2 {size} />
			{@render children?.()}
		{/if}
	</div>

	<ul class="dropdown-content w-fit p-2">
		<li>
			<button
				bind:this={button}
				class="btn btn-sm bg-primary btn-outline text-nowrap rounded-md"
				onclick={async () => {
					disabled = true;
					deleting = true;
					button?.blur();
					await deleteAction();
					disabled = false;
					deleting = false;
				}}>Yes, delete!</button>
		</li>
	</ul>
</div>
