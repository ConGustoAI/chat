<script lang="ts">
	import SidebarNav from '$lib/components/sidebar-nav.svelte';
	import { Separator } from '$lib/components/ui/separator';

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

<!-- <div class="md:hidden">
	<enhanced:img src={FormsLight} alt="Forms" class="block dark:hidden" />
	<enhanced:img src={FormsDark} alt="Forms" class="hidden dark:block" />
</div> -->
<div class="hidden space-y-6 p-10 pb-16 md:block">
	<div class="space-y-0.5">
		<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
		<p class="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
	</div>
	<Separator class="my-6" />
	<div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
		<aside class="-mx-4 lg:w-1/5">
			<SidebarNav items={sidebarNavItems} />
		</aside>
		<div class="flex-1 lg:max-w-2xl">
			<slot />
		</div>
	</div>
</div>
