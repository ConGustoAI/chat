<script lang="ts">
	import { ProvidersGrid } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema/users.js';
	import dbg from 'debug';

	const debug = dbg('app:ui:settings:admin:providers');
</script>

<div class="flex max-w-screen-xl flex-col gap-4">
	<div class="flex gap-4">
		<div class="flex w-fit items-center gap-4 text-nowrap font-bold">
			<span class="text-xl">Default API providers</span>
			<span class="alert alert-warning py-0">Changes made here will be visible to and will affect all users</span>
		</div>
	</div>

	<div class="w-full">
		<div class="divider w-full">Default providers</div>
		<ProvidersGrid
			showDefault={true}
			showCustom={false}
			showDefaultChildren={true}
			editDefaultChildren={true}
			showCustomChildren={false}
			editCustomChildren={false}
			edit={true}
			allowHiding={false}
			newProviderUserID={defaultsUUID}
			newChildUserID={defaultsUUID} />
	</div>
</div>
