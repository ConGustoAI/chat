<script lang="ts">
	import { SidebarNav } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';
	import { ArrowLeftCircle } from 'lucide-svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:settings:layout');

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

<div class="max-w-screen h-screen overflow-auto flex flex-col p-5 pb-16">
	<a class="link flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>

	<SidebarNav items={sidebarNavItems} adminItems={$dbUser?.admin ? adminSidebarItems : []}>
		<div class="mb-20">
			<slot />
		</div>
	</SidebarNav>
</div>
