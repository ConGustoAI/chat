<script lang="ts">
	import { ArrowLeftCircle } from 'lucide-svelte';
	let { children } = $props();
</script>

<div class="div div-col h-full">
	<a class="link ml-2 mt-2 flex gap-2" href="/chat">
		<ArrowLeftCircle />Back to Chat
	</a>
	<div class="flex h-full w-full items-center justify-center">
		<div class="modal-box card card-normal w-fit">
			{@render children()}
		</div>
	</div>
</div>

