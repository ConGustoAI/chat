<script lang="ts">
	import { cn } from '$lib/utils';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:GrowInput');

	let {
		value = $bindable(''),
		class: className = '',
		disabled = false,
		spellcheck = false,
		focused = $bindable(false),
		oninput = () => {},
		onkeydown = () => {},
		onchange = () => {}
	} = $props<{
		value?: string;
		class?: string;
		disabled?: boolean;
		spellcheck?: boolean;
		focused?: boolean;
		oninput?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		onchange?: (event: Event) => void;
	}>();

	let textBox: HTMLDivElement | null = $state(null);

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain');
		if (!textBox || !text) return;
		document.execCommand('insertText', false, text);
	}
</script>

{#if disabled}
	<div
		class={cn(
			'textarea h-fit min-h-10 w-full resize-none overflow-auto whitespace-pre-wrap py-2 text-base',
			className
		)}>
		{value}
	</div>
{:else}
	<div
		tabindex={0}
		role="textbox"
		contenteditable
		{spellcheck}
		bind:this={textBox}
		bind:innerText={value}
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
		onpaste={handlePaste}
		{oninput}
		{onkeydown}
		{onchange}
		class={cn('textarea min-h-10 overflow-y-auto whitespace-pre-wrap py-2 text-base', className)}>
	</div>
{/if}
