<script lang="ts">
	import SidebarNav from '$lib/components/SidebarNav.svelte';

	const sidebarNavItems = [
		{
			title: 'Profile',
			href: '/settings'
		},
		{
			title: 'Providers',
			href: '/settings/providers'
		},
		{
			title: 'Models',
			href: '/settings/models'
		},
		{
			title: 'Assistants',
			href: '/settings/assistants'
		},
		{
			title: 'UI',
			href: '/settings/ui'
		}
	];
</script>

<div class="p-5 pb-16 max-h-screen flex flex-col">
	<!-- <div class="space-y-0.5"> -->
	<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
	<p class="text-muted-foreground">Manage your settings</p>
	<!-- </div> -->
	<div class="divider h-1"></div>
	<!-- <div class="flex flex-1"> -->
	<!-- <aside class="w-1/6 pr-4 "> -->
	<SidebarNav items={sidebarNavItems}>
		<div class="mb-20">
			<slot />
		</div>
	</SidebarNav>
	<!-- </aside> -->
	<!-- <div class="flex-1"> -->
	<!-- </div> -->
	<!-- </div> -->
</div>
