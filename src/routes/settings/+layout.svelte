<script lang="ts">
	import SidebarNav from '$lib/components/SidebarNav.svelte';
	import { ArrowLeftCircle } from 'lucide-svelte';

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
			title: 'Assistants',
			href: '/settings/assistants'
		},

		{
			title: 'UI',
			href: '/settings/ui'
		}
	];

	const adminSidebarItems = [
		{
			title: 'Default Providers',
			href: '/admin/providers'
		},
		{
			title: 'Default Assistants',
			href: '/admin/assistants'
		},
		{
			title: 'Manage users',
			href: '/settings/users'
		}
	];

	
</script>

<div class="flex max-h-screen flex-col p-5 pb-16">
	<!-- <div class="ml-8">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">Manage your settings</p>
	</div> -->

	<a class="link flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>

	<SidebarNav items={sidebarNavItems}>
		<div class="mb-20">
			<slot />
		</div>
	</SidebarNav>
</div>
