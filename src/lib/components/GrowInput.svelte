<script lang="ts">
	import { cn } from '$lib/utils';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:GrowInput');

	export let value = '';
	let className = ''; // Keep this as a local variable
	export { className as class }; // Export it as 'class'
	export let disabled = false;
	export let spellcheck = false;

	let textBox: HTMLDivElement | null = null;

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain');
		if (!textBox || !text) return;
		textBox.innerText = text;
		value = text;
	}
</script>

{#if disabled}
	<div class={cn('textarea h-fit min-h-10 w-full resize-none overflow-auto py-2 text-base', className)}>{value}</div>
{:else}
	<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
	<div
		tabindex={0}
		role="textbox"
		contenteditable
		{spellcheck}
		bind:this={textBox}
		bind:innerText={value}
		on:keydown
		on:change
		on:input
		on:paste={handlePaste}
		class={cn('textarea min-h-10 overflow-y-auto py-2 text-base whitespace-pre-wrap', className)}>
	</div>
{/if}
