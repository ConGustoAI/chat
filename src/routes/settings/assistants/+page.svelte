<script lang="ts">
	import { AssistantGrid } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import dbg from 'debug';
	const debug = dbg('app:ui:settings:assistants');

	$inspect(A.assistants).with((t, c) => debug('A.assistants', { t, c }));

</script>

<div class="flex max-w-screen-xl flex-col gap-4">
	<h2 class="text-xl font-bold">Assistants</h2>

	<div class="w-full">
		<div class="divider w-full">Your assistants</div>
		<AssistantGrid edit={true} newItemUserID={A.dbUser?.id} />

		<div class="divider w-full">Default assistants</div>
		<AssistantGrid showDefault={true} edit={false} newItemUserID={A.dbUser?.id} />
	</div>
</div>
