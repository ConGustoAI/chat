<script lang="ts">
	import { AssistantGrid } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';
	import dbg from 'debug';
	const debug = dbg('app:ui:settings:assistants');
</script>

<div class="flex max-w-screen-xl flex-col gap-4">
	<h2 class="text-xl font-bold">Assistants</h2>

	<div class="w-full overflow-y-auto">
		<div class="divider w-full">Your assistants</div>
		<AssistantGrid edit={true} newItemUserID={$dbUser?.id} />

		<div class="divider w-full">Default assistants</div>
		<AssistantGrid showDefault={true} edit={false} newItemUserID={$dbUser?.id} />
	</div>
</div>
