<script lang="ts">
	import { dbUser } from '$lib/stores/appstate';

	export let total: number;

	$: costShow = ($dbUser?.costShow ?? -1) < 0 ? +Infinity : ($dbUser?.costShow ?? +Infinity);
	$: costWarn1 = ($dbUser?.costWarn1 ?? -1) < 0 ? +Infinity : ($dbUser?.costWarn1 ?? +Infinity);
	$: costWarn2 = ($dbUser?.costWarn2 ?? -1) < 0 ? +Infinity : ($dbUser?.costWarn2 ?? +Infinity);

	$: color = total > costWarn2 ? 'text-error' : total > costWarn1 ? 'text-warning' : '';
</script>

{#if total > costShow || total > costWarn1 || total > costWarn2}
	<span class="font-mono text-xs {color}">${total.toFixed(2)}</span>
{/if}
