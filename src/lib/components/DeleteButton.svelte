<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { Trash2 } from 'lucide-svelte';

	let {
		deleteAction,
		size = 15,
		btnClass = '',
		class: className = '',
		disabled = false,
		children,
		title='Delete'
	} = $props<{
		deleteAction: () => Promise<void> | void;
		size?: number;
		btnClass?: string;
		class?: string;
		disabled?: boolean;
		children?: any;
		title?: string|undefined;
	}>();

	let deleting = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
</script>

<div class={cn('dropdown', className)} {title}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div tabindex={0} class={cn(disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<!-- svelte-ignore slot_element_deprecated -->
			<div class="loading loading-sm"></div>
		{:else}
			<Trash2 {size} />
		{/if}
		{@render children?.()}
	</div>

	<ul class="dropdown-content w-fit p-2 z-20">
		<li>
			<button
				bind:this={button}
				class="btn btn-outline btn-sm text-nowrap rounded-md bg-primary"
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
