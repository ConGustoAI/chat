<script lang="ts">
	import { cn } from '$lib/utils';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:GrowInput');
		
	export let value = '';
	let className = ''; 
	export { className as class }; // Export it as 'class'
	export let disabled = false;
	export let spellcheck = false;

	let textBox: HTMLDivElement | null = null;

	// Handle the paste event manually
	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain');
		if (!textBox || !text) return;
		document.execCommand('insertText', false, text);
		value = textBox.innerText;
	}

	// Update value on input changes
	function handleInput() {
		if (textBox) {
			value = textBox.innerText;
		}
	}

	$: if (textBox && textBox.innerText !== value) {
		textBox.innerText = value;
	}
</script>

{#if disabled}
	<div class={cn('textarea h-fit min-h-10 w-full resize-none overflow-auto py-2 text-base', className)}>{value}</div>
{:else}
	<div
		tabindex={0}
		role="textbox"
		contenteditable
		{spellcheck}
		bind:this={textBox}
		on:input={handleInput}
		on:paste={handlePaste}
		on:keydown
		class={cn('textarea min-h-10 overflow-y-auto py-2 text-base whitespace-pre-wrap', className)} />
{/if}
