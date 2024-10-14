<script lang="ts">
	import { SidebarNav } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { ArrowLeftCircle } from 'lucide-svelte';

	import dbg from 'debug';
	import { APIfetchProviders } from '$lib/api/provider';
	import { APIfetchModels } from '$lib/api/model';
	import { APIfetchKeys } from '$lib/api/key';
	import { toIdMap } from '$lib/utils/utils';
	const debug = dbg('app:ui:settings:layout');

	let { data, children } = $props();

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

<div class="max-w-screen flex h-screen flex-col overflow-auto p-5 pb-16">
	<a class="link flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>

	<SidebarNav items={sidebarNavItems} adminItems={A.dbUser?.admin ? adminSidebarItems : []}>
		<div class="mb-20">
			{@render children()}
		</div>
	</SidebarNav>
</div>
