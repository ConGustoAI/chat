<script lang="ts">
	import { cn } from '$lib/utils/utils';

	import dbg from 'debug';
	const debug = dbg('app:ui:components:GrowInput');

	let {
		value = $bindable(),
		placeholder = '',
		class: className = '',
		disabled = false,
		spellcheck = true,
		focused = $bindable(),
		oninput = () => {},
		onkeydown = () => {},
		onchange = () => {},
		handlePaste = _handlePaste
	} = $props<{
		value: string | undefined;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		spellcheck?: boolean;
		focused?: boolean;
		oninput?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		onchange?: (event: Event) => void;
		handlePaste?: (event: ClipboardEvent) => void;
	}>();

	let textBox: HTMLDivElement | null = $state(null);

	function _handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		debug('handlePaste',  event );
		const text = event.clipboardData?.getData('text/plain');
		if (!text) return;
		document.execCommand('insertText', false, text);
	}
</script>

<div class="relative h-full w-full">
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
			onpaste={(event) => handlePaste(event)}
			{oninput}
			{onkeydown}
			{onchange}
			class={cn('textarea h-full min-h-10 overflow-y-auto whitespace-pre-wrap py-2 text-base', className)}>
		</div>
		{#if value === '' && !focused}
			<div class={cn('pointer-events-none absolute inset-0 p-2 opacity-50', className)}>
				{placeholder}
			</div>
		{/if}
	{/if}
</div>
