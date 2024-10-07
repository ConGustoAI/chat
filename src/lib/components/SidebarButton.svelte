<script lang="ts">
	import { ArrowLeftSquare, ArrowRightSquare } from 'lucide-svelte';
	import { A } from '$lib/appstate.svelte';
</script>

<button class="btn btn-circle rounded-xl" onclick={() => (A.sidebarOpen = !A.sidebarOpen)}>
	{#if A.sidebarOpen}
		<ArrowLeftSquare />
	{:else}
		<ArrowRightSquare />
	{/if}
</button>
