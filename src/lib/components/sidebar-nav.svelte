<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	// import { cn } from '$lib/utils.js';
	// import { page } from '$app/stores';
	// import { Button } from '$lib/components/ui/button';

	export let items: { href: string; title: string }[];

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>


<div class="drawer lg:drawer-open">
	<input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
	<div class="drawer-side">
	  <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
	  <ul class="menu  text-base-content min-h-full w-80 p-4">
		{#each items as item}
		<li><a href={item.href}>{item.title}</a></li>
		{/each}

	  </ul>
	</div>
  </div>
