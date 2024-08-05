<script lang="ts">
	import { ArrowLeftSquare, ArrowRightSquare } from 'lucide-svelte';

	export let drawer_open: boolean;
</script>

<button class="btn btn-circle rounded-xl" on:click={() => (drawer_open = !drawer_open)}>
	{#if drawer_open}
		<ArrowLeftSquare />
	{:else}
		<ArrowRightSquare />
	{/if}
</button>
