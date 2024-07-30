<script lang="ts">
	import { cn } from '$lib/utils';
	import type { ComponentType } from 'svelte';

	export let loading = false;
	export let onClick = () => {};
	export let IconComponent: ComponentType | undefined;
	$: containerClass = cn('btn btn-primary w-fit', $$restProps.class);
</script>

<button class={containerClass} on:click={onClick} disabled={loading}>
	{#if loading}
		<span class="loading loading-spinner"></span>
	{:else if IconComponent}
		<IconComponent />
	{/if}
	<slot />
</button>
