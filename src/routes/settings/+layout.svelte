<script lang="ts">
	import { APIfetchAssistants, APIfetchKeys, APIfetchModels, APIfetchProviders } from '$lib/api';
	import { SidebarNav } from '$lib/components';
	import { apiKeys, assistants, dbUser, models, providers } from '$lib/stores/appstate';
	import { toIdMap } from '$lib/utils';
	import { ArrowLeftCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';

	import dbg from 'debug';
	const debug = dbg('app:ui:settings:layout');

	let loading = false;
	onMount(async () => {
		debug('onMount');
		loading = true;
		const [fetchedProviders, fetchedModels, fetchedApiKeys] = await Promise.all([
			APIfetchProviders(),
			APIfetchModels(),
			APIfetchKeys()
		]);

		$providers = toIdMap(fetchedProviders);
		$models = toIdMap(fetchedModels);
		$apiKeys = toIdMap(fetchedApiKeys);
		loading = false;
		debug('onMount', { assistants: $assistants, providers: $providers, models: $models });
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

<div class="flex max-h-screen flex-col p-5 pb-16">
	<a class="link flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>

	<SidebarNav items={sidebarNavItems} adminItems={$dbUser?.admin ? adminSidebarItems : []}>
		<div class="mb-20">
			{#if loading}
				<div class="loading loading-lg" />
			{:else}
				<slot />
			{/if}
		</div>
	</SidebarNav>
</div>
