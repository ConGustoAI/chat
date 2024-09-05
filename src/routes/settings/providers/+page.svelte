<script lang="ts">
	import { ProvidersGrid } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';

	import dbg from 'debug';
	const debug = dbg('app:ui:settings:assistants');
</script>

<div class="flex max-w-screen-xl flex-col gap-4">
	<h2 class="text-xl font-bold">Providers</h2>

	<div class=" ">
		<div class="divider w-full">Your providers</div>
		<ProvidersGrid
			showDefault={false}
			showCustom={true}
			showDefaultChildren={false}
			showCustomChildren={true}
			edit={true}
			editDefaultChildren={false}
			editCustomChildren={true}
			newProviderUserID={$dbUser?.id ?? 'anon'}
			newChildUserID={$dbUser?.id ?? 'anon'} />

		<div class="divider w-full">Default providers</div>
		<ProvidersGrid
			showDefault={true}
			showCustom={false}
			showDefaultChildren={true}
			showCustomChildren={true}
			editDefaultChildren={false}
			editCustomChildren={true}
			edit={false}
			newProviderUserID={$dbUser?.id ?? 'anon'}
			newChildUserID={$dbUser?.id ?? 'anon'} />
	</div>
</div>
