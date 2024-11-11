<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { SidebarNav } from '$lib/components';
	import { ArrowLeftCircle } from 'lucide-svelte';

	import dbg from 'debug';
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const debug = dbg('app:ui:settings:layout');

	let { children } = $props();

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
			href: '/settings/admin/providers'
		},
		{
			title: 'Default Assistants',
			href: '/settings/admin/assistants'
		},
		{
			title: 'Manage users',
			href: '/settings/admin/users'
		}
	];
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="max-w-screen flex h-screen flex-col overflow-auto p-5 pb-16">
	<a class="link flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>

	<SidebarNav items={sidebarNavItems} adminItems={A.user?.admin ? adminSidebarItems : []}>
		<div class="mb-20">
			{@render children()}
		</div>
	</SidebarNav>
</div>
