<script lang="ts">
	import { A } from '$lib/appstate.svelte';

	let { total }: { total: number } = $props();

	let costShow = $derived((A.user?.costShow ?? -1) < 0 ? +Infinity : (A.user?.costShow ?? +Infinity));
	let costWarn1 = $derived((A.user?.costWarn1 ?? -1) < 0 ? +Infinity : (A.user?.costWarn1 ?? +Infinity));
	let costWarn2 = $derived((A.user?.costWarn2 ?? -1) < 0 ? +Infinity : (A.user?.costWarn2 ?? +Infinity));

	let color = $derived(total > costWarn2 ? 'text-error' : total > costWarn1 ? 'text-warning' : '');
</script>

{#if total > costShow || total > costWarn1 || total > costWarn2}
	<span class="font-mono text-xs {color}">${total.toFixed(2)}</span>
{/if}
