<script lang="ts">
	import { fixNumberInput } from '$lib/utils';

	export let assistant: AssistantInterface;
	export let model;
	export let provider: ProviderInterface;

	export let edit;
	export let statusChanged;
</script>

<div
	class="grid w-full grid-cols-[min-content,max-content,max-content,max-content,min-content,min-content,min-content,min-content,auto] items-center gap-x-4 gap-y-2">
	<div class="label-text flex items-center gap-2">
		<div class="">Temperature</div>
		<input
			type="text"
			class="input input-sm input-bordered w-14 grow rounded-md py-0 leading-none"
			bind:value={assistant.temperature}
			on:change={(e) => {
				fixNumberInput(e, 0, model?.maxTemp ?? 2);
				statusChanged();
			}} />
	</div>
	<div class="label-text flex w-fit items-center gap-2">
		<div class="w-fit">Top P</div>
		<input
			type="text"
			class="input input-sm input-bordered w-14 grow rounded-md py-0 leading-none"
			bind:value={assistant.topP}
			on:change={(e) => {
				fixNumberInput(e, 0, 1);
				statusChanged();
			}} />
	</div>
	<!-- <div class="label-text align-text-bottom">Top P [0...1]</div> -->
	<div class="label-text flex w-fit items-center gap-2">
		<div class="w-fit">Top K</div>
		<input
			type="text"
			class="input input-sm input-bordered w-14 grow rounded-md py-0 leading-none"
			bind:value={assistant.topK}
			on:change={(e) => {
				fixNumberInput(e, 0, 1000);
				statusChanged();
			}} />
	</div>

	<div class="label-text flex w-fit items-center gap-2 pr-5">
		<div class="w-fit">Out tokens</div>
		<input
			type="text"
			class="input input-sm input-bordered w-14 grow rounded-md py-0 leading-none"
			bind:value={assistant.maxTokens}
			on:change={(e) => {
				fixNumberInput(e, 0, model?.maxTokens ?? 4096);
				statusChanged();
			}} />
	</div>

	<div class="label-test text-xl" title="Images">🎨</div>
	<div class="label-test text-xl" title="Audio">🔉</div>
	<div class="label-test text-xl" title="Video">📺</div>
	<div class="label-test">Prefill</div>
	{#if provider.type === 'google'}
		<div class="label-test">Gemini safety sensitivity (all categories)</div>
	{:else}
		<div />
	{/if}

	<input
		type="range"
		required
		class="range range-sm w-full"
		bind:value={assistant.temperature}
		step={0.05}
		min={0}
		max={model?.maxTemp}
		disabled={!model?.images || !edit}
		on:change={(e) => {
			fixNumberInput(e, 0, model?.maxTemp ?? 2);
			statusChanged();
		}} />

	<input
		type="range"
		required
		class="range range-sm w-full"
		bind:value={assistant.topP}
		min={0}
		max={1}
		step={0.01}
		disabled={!model?.images || !edit}
		on:change={(e) => {
			fixNumberInput(e, 0, 1);
			statusChanged();
		}} />

	<div />
	

	<input
		type="range"
		required
		class="range range-sm w-full pr-5"
		bind:value={assistant.maxTokens}
		min={0}
		max={model?.maxTokens ?? 4096}
		step={1}
		disabled={!model?.images || !edit}
		on:change={(e) => {
			fixNumberInput(e, 0, model?.maxTokens ?? 4096);
			statusChanged();
		}} />

	<input
		type="checkbox"
		id="imagesCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.images}
		disabled={!model?.images || !edit}
		on:change={statusChanged} />
	<input
		type="checkbox"
		id="audioCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.audio}
		disabled={!model?.audio || !edit}
		on:change={statusChanged} />
	<input
		type="checkbox"
		id="videoCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.video}
		disabled={!model?.video || !edit}
		on:change={statusChanged} />
	<input
		type="checkbox"
		id="prefillCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.prefill}
		disabled={!model?.prefill || !edit}
		on:change={statusChanged} />

	{#if provider.type === 'google'}
		<div class="flex flex-col items-center gap-4">
			<div class="flex w-full flex-col gap-2">
				<input
					type="range"
					required
					class="range range-sm w-full"
					bind:value={assistant.googleSafetyThreshold}
					step={1}
					min={0}
					max={3}
					disabled={!edit}
					on:change={statusChanged} />
			</div>
		</div>
	{:else}
		<div />
	{/if}
</div>
