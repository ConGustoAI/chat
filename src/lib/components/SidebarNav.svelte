<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import { page } from '$app/stores';

	export let items: { href: string; title: string }[];
	export let adminItems: { href: string; title: string }[];
</script>

<div class="drawer lg:drawer-open">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		<slot />
	</div>

	<ul class="menu drawer-side h-auto p-4 pr-20 text-xl">
		{#each items as item}
			{@const selected = $page.route.id == item.href}
			<li><a class:font-bold={selected} href={item.href}>{item.title}</a></li>
		{/each}
		{#if adminItems.length}
			<div class="divider mx-0 px-0">Admin</div>
		{/if}
		{#each adminItems as item}
			{@const selected = $page.route.id == item.href}
			<li><a class:font-bold={selected} href={item.href}>{item.title}</a></li>
		{/each}
	</ul>
</div>
