<script lang="ts">
	import { GrowInput } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { createEventDispatcher } from 'svelte';

	let {
		assistant = $bindable(),
		edit,
		oninput = () => {}
	}: { assistant: AssistantInterface; edit: boolean; oninput: (event: Event) => void } = $props();

</script>

<div class="col-span-full flex flex-col">
	<div class="flex w-full items-center justify-between">
		<span class=" px-1 py-2 text-sm"
			>About user. Include into system prompt with <code class="font-bold">{@html `{about}`}</code></span>

		<div class="flex items-center gap-2">
			{#if assistant.aboutUserFromUser}
				<a href="/settings" class="link text-sm">Edit your profile</a>
			{/if}
			<label for="aboutUserFromUser" class="cursor-pointer text-sm">From my profile</label>
			<input
				type="checkbox"
				class="checkbox checkbox-xs"
				bind:checked={assistant.aboutUserFromUser}
				id="aboutUserFromUser"
				disabled={!edit} />
		</div>
	</div>

	{#if assistant.aboutUserFromUser}
		<GrowInput class="textarea-bordered w-full" value={A.dbUser?.aboutUser ?? ''} onchange={oninput} disabled={true} />
	{:else}
		<GrowInput class="textarea-bordered" bind:value={assistant.aboutUser} {oninput} />
	{/if}
</div>

<div class="col-span-full flex flex-col">
	<div class="flex w-full items-center justify-between">
		<span class="px-1 py-2 text-sm"
			>Assistant instructions. Include into system prompt with <code class="font-bold">{@html `{instructions}`}</code
			></span>

		<div class="flex items-center gap-2">
			{#if assistant.assistantInstructionsFromUser}
				<a href="/settings" class="link text-sm">Edit your profile</a>
			{/if}
			<label for="instructionsFromUser" class="cursor-pointer text-sm">From my profile</label>
			<input
				type="checkbox"
				class="checkbox checkbox-xs"
				bind:checked={assistant.assistantInstructionsFromUser}
				id="instructionsFromUser"
				onchange={oninput}
				disabled={!edit} />
		</div>
	</div>

	{#if assistant.assistantInstructionsFromUser}
		<GrowInput
			class="textarea-bordered w-full"
			value={A.dbUser?.assistantInstructions ?? ''}
			{oninput}
			disabled={true} />
	{:else}
		<GrowInput
			class="textarea-bordered w-full"
			bind:value={assistant.assistantInstructions}
			{oninput}
			disabled={!edit} />
	{/if}
</div>

<div class="col-span-full flex flex-col">
	<div class="flex w-full items-center justify-between">
		<span class="px-1 py-2 text-sm">System Prompt</span>
	</div>

	<GrowInput
		class="textarea-bordered"
		bind:value={assistant.systemPrompt}
		{oninput}
		disabled={!edit} />
</div>
