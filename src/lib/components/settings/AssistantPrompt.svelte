<script lang="ts">
	import { GrowInput } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';
	import { createEventDispatcher } from 'svelte';

	export let assistant: AssistantInterface;
	export let edit: boolean;

	const dispatch = createEventDispatcher();
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
				on:change
				disabled={!edit} />
		</div>
	</div>

	{#if assistant.aboutUserFromUser}
		<GrowInput class="textarea-bordered w-full" value={$dbUser?.aboutUser ?? ''} on:change disabled={true} />
	{:else}
		<GrowInput class="textarea-bordered" bind:value={assistant.aboutUser} on:input={() => dispatch('change', {})} />
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
				on:change
				disabled={!edit} />
		</div>
	</div>

	{#if assistant.assistantInstructionsFromUser}
		<GrowInput
			class="textarea-bordered w-full"
			value={$dbUser?.assistantInstructions ?? ''}
			on:input={() => dispatch('change', {})}
			disabled={true} />
	{:else}
		<GrowInput
			class="textarea-bordered w-full"
			bind:value={assistant.assistantInstructions}
			on:input={() => dispatch('change', {})}
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
		on:input={() => dispatch('change', {})}
		disabled={!edit} />
</div>
