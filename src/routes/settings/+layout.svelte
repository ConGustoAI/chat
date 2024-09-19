<script lang="ts">
	import { SidebarNav } from '$lib/components';
	import { apiKeys, assistants, dbUser, models, providers } from '$lib/stores/appstate';
	import { ArrowLeftCircle } from 'lucide-svelte';

	import dbg from 'debug';
	import { APIfetchProviders } from '$lib/api/provider.js';
	import { APIfetchModels } from '$lib/api/model.js';
	import { APIfetchKeys } from '$lib/api/key.js';
	import { toIdMap } from '$lib/utils.js';
	const debug = dbg('app:ui:settings:layout');


	export let data;

	dbUser.subscribe(async () => {
		debug('dbUser changed, fetching data');

		const [fetchedProviders, fetchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		$assistants = toIdMap(data.assistants);
		$providers = toIdMap(fetchedProviders);
		$models = toIdMap(fetchedModels);
		$apiKeys = toIdMap(fetchedApiKeys);

		debug('Done fetching', {
			assistants: $assistants,
			providers: $providers,
			models: $models,
			dbUser: $dbUser,
			apiKeys: Object.keys($apiKeys)
		});
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
