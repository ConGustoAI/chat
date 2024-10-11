<script lang="ts">
	import { SidebarNav } from '$lib/components';
	import { A } from '$lib/appstate.svelte.js';
	import { ArrowLeftCircle } from 'lucide-svelte';

	import dbg from 'debug';
	import { APIfetchProviders } from '$lib/api/provider.js';
	import { APIfetchModels } from '$lib/api/model.js';
	import { APIfetchKeys } from '$lib/api/key.js';
	import { toIdMap } from '$lib/utils.js';
	const debug = dbg('app:ui:settings:layout');

	let { data, children } = $props();

	// A.dbUser.subscribe(async () => {

	$effect(() => {
		debug('dbUser changed, fetching data');
		if (A.dbUser) {
			Promise.all([APIfetchProviders(), APIfetchModels(), APIfetchKeys()]).then(
				([fetchedProviders, fetchedModels, fetchedApiKeys]) => {
					A.assistants = toIdMap(data.assistants);
					A.providers = toIdMap(fetchedProviders);
					A.models = toIdMap(fetchedModels);
					A.apiKeys = toIdMap(fetchedApiKeys);

					debug('Done fetching', $state.snapshot({
						assistants: A.assistants,
						providers: A.providers,
						models: A.models,
						dbUser: A.dbUser,
						apiKeys: Object.keys(A.apiKeys)
					}));
				}
			);
		}
	});

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
