<script lang="ts">
	import { AssistantGrid } from '$lib/components';
	import dbg from 'debug';
	const debug = dbg('app:ui:settings:assistants');
</script>

<div class="max-w-screen-xl flex flex-col gap-4">
	<div class="flex gap-4">
		<div class="flex w-fit items-center gap-4 text-nowrap font-bold">
			<span class="text-xl">Default Assistants</span>
			<span class="alert alert-warning py-0">Changes made here will be visible to and will affect all users</span>
		</div>
	</div>

	<div class="w-full">
		<div class="divider w-full">Default assistants</div>
		<AssistantGrid showDefault={true} edit={true} allowHiding={false}/>
	</div>
</div>
