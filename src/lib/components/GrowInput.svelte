<script lang="ts">
	import { cn } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';
	import dbg from 'debug';

	const debug = dbg('app:ui:components:GrowInput');
	export let value = '';
	let className = ''; // Keep this as a local variable
	export { className as class }; // Export it as 'class'
	export let disabled = false;
	export let spellcheck = false;

	// const dispatch = createEventDispatcher();

	// $: if (value && !disabled) {
	// 	dispatch('change', value);
	// }
</script>

{#if disabled}
	<div class={cn('textarea h-fit min-h-10 w-full resize-none overflow-auto py-1', className)}>{value}</div>
{:else}
	<div
		tabindex={0}
		role="textbox"
		contenteditable
		{spellcheck}
		bind:textContent={value}
		on:keydown
		on:change
		on:input
		class={cn('textarea h-fit min-h-10 w-full resize-none overflow-auto py-1', className)}>
	</div>
{/if}
