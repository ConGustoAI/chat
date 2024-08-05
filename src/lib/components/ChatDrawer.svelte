<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import { page } from '$app/stores';
	// import { cn } from '$lib/utils.js';
	// import { page } from '$app/stores';
	// import { Button } from '$lib/components/ui/button';

	export let open: boolean;
	export let conversations;
</script>

<div class="flex grow">
	<div class="flex max-w-56 flex-col">
		<div class="p-4">
			<input type="text" placeholder="Search chats..." class="input input-bordered w-full" />
		</div>
		<ul class="menu">
			{#each conversations as c}
				<li>
					<a href="/chat/{c.id}/" class="max-w-full"><p class="truncate">{c.like ? '⭐' : ''} {c.summary}</p></a>
				</li>
			{/each}
		</ul>
	</div>
	<div class="">
		<div class="flex h-full flex-col">
			<div class="flex-grow overflow-y-auto">
				<slot />
			</div>

			<div class="divider" />
			<div class="bg-base-100 p-4">
				<form class="flex items-center">
					<input type="text" placeholder="Type your message..." class="input input-bordered mr-2 flex-grow" />
					<button type="submit" class="btn btn-primary">Send</button>
				</form>
			</div>
		</div>
	</div>
</div>
