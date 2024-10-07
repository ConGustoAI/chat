<script lang="ts">
	import { page } from '$app/stores';

	let {
		items,
		adminItems,
		children
	}: { items: { href: string; title: string }[]; adminItems: { href: string; title: string }[], children:any } = $props();
</script>

<div class="drawer lg:drawer-open">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		{@render children()}
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
