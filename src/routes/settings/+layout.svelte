<script lang="ts">
	import SidebarNav from '$lib/components/SidebarNav.svelte';
	import { ArrowLeftCircle } from 'lucide-svelte';

	export let data;
	export let { dbUser } = data;

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

<div class="flex max-h-screen flex-col p-5 pb-16">
	<a class="link flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>
	<!-- We allow anonymous users a sneak peek under into the Admin panel. All security is handled on the server side-->
	<SidebarNav items={sidebarNavItems} adminItems={!dbUser || dbUser?.admin ? adminSidebarItems : []}>
		<div class="mb-20">
			<slot />
		</div>
	</SidebarNav>
</div>
