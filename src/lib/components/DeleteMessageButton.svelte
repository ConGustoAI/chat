<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { Trash2 } from 'lucide-svelte';

	let {
		deleteAction,
		deleteWithMediaAction,
		btnClass = '',
		class: className = '',
		disabled = false,
		children,
		title = 'Delete'
	} = $props<{
		deleteAction: () => Promise<void> | void;
		deleteWithMediaAction?: () => Promise<void> | void;
		btnClass?: string;
		class?: string;
		disabled?: boolean;
		children?: any;
		title?: string | undefined;
	}>();

	let deleting = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
</script>

<div class={cn('dropdown', className)} {title} >
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div tabindex={0} class={cn(disabled ? 'btn-disabled' : '', btnClass)}>
		{#if deleting}
			<!-- svelte-ignore slot_element_deprecated -->
			<div class="loading loading-sm"></div>
		{:else}
			<Trash2 size="fit-h" />
		{/if}
		<!-- {@render children?.()} -->
	</div>

	<ul class="menu dropdown-content z-50 w-fit p-2 bg-base-200 rounded-md">
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
				}}>Delete message</button>
		</li>
		{#if deleteWithMediaAction}
			<li>
				<button
					bind:this={button}
					class="btn btn-outline btn-sm text-nowrap rounded-md bg-primary"
					onclick={async () => {
						console.log('click');
						disabled = true;
						deleting = true;
						button?.blur();
						await deleteWithMediaAction();
						disabled = false;
						deleting = false;
					}}>Delete message and media</button>
			</li>
		{/if}
	</ul>
</div>
