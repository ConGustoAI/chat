<script lang="ts">
	import { ArrowLeftSquare, ArrowRightSquare } from 'lucide-svelte';
	import { sidebarOpen } from '$lib/stores/appstate';
</script>

<button class="btn btn-circle rounded-xl" on:click={() => ($sidebarOpen = !$sidebarOpen)}>
	{#if $sidebarOpen}
		<ArrowLeftSquare />
	{:else}
		<ArrowRightSquare />
	{/if}
</button>
