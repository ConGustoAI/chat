<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { Trash2 } from 'lucide-svelte';

	let {
		deleteAction,
		btnClass = '',
		class: className = '',
		disabled = false,
		title = 'Delete'
	}: {
		deleteAction: () => Promise<void> | void;
		btnClass?: string;
		class?: string;
		disabled?: boolean;
		title?: string | undefined;
	} = $props();

	let deleting = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
</script>

<div class={cn('dropdown', className)} {title}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div tabindex={0} class={cn(disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<div class="loading loading-sm"></div>
		{:else}
			<Trash2 size="fit-h" />
		{/if}
	</div>

	<ul class="dropdown-content z-50 w-fit p-2">
		<li>
			<button
				bind:this={button}
				class="btn btn-outline btn-sm text-nowrap rounded-md bg-primary"
				onclick={async () => {
					console.log('click');
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
