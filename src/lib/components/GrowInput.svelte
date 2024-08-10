<script lang="ts">
	import { cn } from '$lib/utils';

	export let maxLines = 10;
	export let value = '';
	export let submit;
	export let cancel = () => {};
	let className = ''; // Keep this as a local variable
	export { className as class }; // Export it as 'class'

	let el: HTMLTextAreaElement;
	let lineHeight = 0;

	function adjustHeight() {
		if (el) {
			lineHeight = parseInt(getComputedStyle(el).lineHeight);
			const paddingTop = parseInt(getComputedStyle(el).paddingTop);
			const paddingBottom = parseInt(getComputedStyle(el).paddingBottom);
			const totalPadding = paddingTop + paddingBottom;

			el.style.height = '0';
			const newHeight = Math.min(el.scrollHeight, lineHeight * maxLines + totalPadding);
			el.style.height = `${Math.max(newHeight, lineHeight + totalPadding)}px`;
		}
		return {};
	}

	$: {

		el;
		adjustHeight();
	}
</script>

<textarea
	bind:value
	bind:this={el}
	on:input={adjustHeight}
	on:keydown={(event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
		if (event.key === 'Escape') {
			cancel();
		}
	}}
	class={cn('input input-bordered w-full resize-none overflow-auto py-3', className)} />
