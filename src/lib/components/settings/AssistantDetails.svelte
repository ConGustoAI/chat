<script lang="ts">
	import { fixNumberInput } from '$lib/utils/utils';
	import InfoPopup from '../InfoPopup.svelte';

	let {
		assistant = $bindable(),
		model,
		provider,
		edit,
		onchange
	}: {
		assistant: AssistantInterface;
		model: ModelInterface | undefined;
		provider: ProviderInterface;
		edit: boolean;
		onchange: () => void;
	} = $props();

	$effect(() => {
		if (model) {
			let changed = false;
			if (assistant.temperature_enabled && model.temperature_enabled === false) {
				assistant.temperature_enabled = false;
				changed = true;
			}
			if (assistant.top_p_enabled && model.top_p_enabled === false) {
				assistant.top_p_enabled = false;
				changed = true;
			}
			if (assistant.top_k_enabled && model.top_k_enabled === false) {
				assistant.top_k_enabled = false;
				changed = true;
			}
			if (assistant.max_tokens_enabled && model.max_tokens_enabled === false) {
				assistant.max_tokens_enabled = false;
				changed = true;
			}
			if (assistant.prefill && model.prefill === false) {
				assistant.prefill = false;
				changed = true;
			}
			if (assistant.images && model.images === false) {
				assistant.images = false;
				changed = true;
			}
			if (assistant.audio && model.audio === false) {
				assistant.audio = false;
				changed = true;
			}
			if (assistant.video && model.video === false) {
				assistant.video = false;
				changed = true;
			}
			if (assistant.pdf && model.pdf === false) {
				assistant.pdf = false;
				changed = true;
			}
			if (changed) {
				onchange();
			}
		}
	});
</script>

<div
	class="grid w-full grid-cols-[min-content,max-content,max-content,max-content,min-content,min-content,min-content,min-content,min-content,auto] items-center gap-x-4 gap-y-2">
	<div class="flex items-center justify-center gap-2 text-sm">
		<div class="text-center">Temperature</div>
	</div>
	<div class="flex items-center justify-center gap-2 text-sm">
		<div class="text-center">Top P</div>
	</div>
	<div class="flex items-center justify-center gap-2 text-sm">
		<div class="text-center">Top K</div>
	</div>

	<div class="flex items-center justify-center gap-2 pr-5 text-sm">
		<div class="text-center">Out tokens</div>
	</div>

	<div class="relative flex justify-center text-center font-bold">
		📝
		<div class="absolute -top-5">
			<InfoPopup title="Model supports prefill"
				>Prefill lets you start the message for the assistant, and the assistant will continue the message.</InfoPopup>
		</div>
	</div>

	<div class="relative flex justify-center text-center text-xl font-bold" title="Images">
		🎨
		<div class="absolute -top-5"><InfoPopup title="Model suppurts images" /></div>
	</div>
	<div class="relative flex justify-center text-center text-xl font-bold" title="Audio">
		🔉
		<div class="absolute -top-5"><InfoPopup title="Model supports audio" /></div>
	</div>
	<div class="relative flex justify-center text-xl font-bold" title="Video">
		📺
		<div class="absolute -top-5"><InfoPopup title="Model supports video" /></div>
	</div>
	<div class="relative flex justify-center text-xl font-bold" title="PDF">
		🖨️
		<div class="absolute -top-5"><InfoPopup title="Model supports PDF" /></div>
	</div>
	{#if provider.type === 'google'}
		<div class="flex justify-center label-test">Gemini safety threshold (all categories)</div>
	{:else}
		<div></div>
	{/if}

	<div class="flex items-center gap-2">
		<input
			type="checkbox"
			id="temperature_enabled-{assistant.id}"
			class="checkbox checkbox-xs"
			checked={assistant.temperature_enabled && model?.temperature_enabled !== false}
			disabled={!edit || !model?.temperature_enabled}
			onchange={(e) => {
				assistant.temperature_enabled = (e.target as HTMLInputElement).checked;
				onchange();
			}} />
		<input
			type="number"
			class="input input-sm input-bordered w-14 py-0 leading-none no-spinner"
			bind:value={assistant.temperature}
			onchange={(e) => {
				fixNumberInput(e, 0, model?.maxTemp ?? 2);
				onchange();
			}}
			disabled={!edit || !(assistant.temperature_enabled && model?.temperature_enabled !== false)} />
	</div>

	<div class="flex items-center gap-2">
		<input
			type="checkbox"
			id="top_p_enabled-{assistant.id}"
			class="checkbox checkbox-xs"
			checked={assistant.top_p_enabled && model?.top_p_enabled !== false}
			disabled={!edit || !model?.top_p_enabled}
			onchange={(e) => {
				assistant.top_p_enabled = (e.target as HTMLInputElement).checked;
				onchange();
			}} />
		<input
			type="number"
			class="input input-sm input-bordered w-14 py-0 leading-none no-spinner"
			bind:value={assistant.topP}
			onchange={(e) => {
				fixNumberInput(e, 0, 1);
				onchange();
			}}
			disabled={!edit || !(assistant.top_p_enabled && model?.top_p_enabled !== false)} />
	</div>

	<div class="flex items-center gap-2">
		<input
			type="checkbox"
			id="top_k_enabled-{assistant.id}"
			class="checkbox checkbox-xs"
			checked={assistant.top_k_enabled && model?.top_k_enabled !== false}
			disabled={!edit || !model?.top_k_enabled}
			onchange={(e) => {
				assistant.top_k_enabled = (e.target as HTMLInputElement).checked;
				onchange();
			}} />
		<input
			type="number"
			class="input input-sm input-bordered w-14 py-0 leading-none no-spinner"
			bind:value={assistant.topK}
			onchange={(e) => {
				fixNumberInput(e, 0, 1000);
				onchange();
			}}
			disabled={!edit || !(assistant.top_k_enabled && model?.top_k_enabled !== false)} />
	</div>

	<div class="flex items-center gap-2 pr-5">
		<input
			type="checkbox"
			id="max_tokens_enabled-{assistant.id}"
			class="checkbox checkbox-xs"
			checked={assistant.max_tokens_enabled && model?.max_tokens_enabled !== false}
			disabled={!edit || !model?.max_tokens_enabled}
			onchange={(e) => {
				assistant.max_tokens_enabled = (e.target as HTMLInputElement).checked;
				onchange();
			}} />
		<input
			type="number"
			class="input input-sm input-bordered w-14 py-0 leading-none no-spinner"
			bind:value={assistant.maxTokens}
			onchange={(e) => {
				fixNumberInput(e, 0, model?.outputContext ?? 4096);
				onchange();
			}}
			disabled={!edit || !(assistant.max_tokens_enabled && model?.max_tokens_enabled !== false)} />
	</div>

	<input
		type="checkbox"
		id="prefillCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.prefill}
		disabled={!model?.prefill || !edit}
		{onchange} />

	<input
		type="checkbox"
		id="imagesCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.images}
		disabled={!model?.images || !edit}
		{onchange} />
	<input
		type="checkbox"
		id="audioCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.audio}
		disabled={!model?.audio || !edit}
		{onchange} />
	<input
		type="checkbox"
		id="videoCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.video}
		disabled={!model?.video || !edit}
		{onchange} />

	<input
		type="checkbox"
		id="pdfCheckbox-{assistant.id}"
		class="checkbox checkbox-sm"
		bind:checked={assistant.pdf}
		disabled={!model?.pdf || !edit}
		{onchange} />

	{#if provider.type === 'google'}
	<div class="mt-4 w-full">
		<div class="flex justify-center gap-2 items-start">
			<p>Sensitive</p>
			<div class="w-full max-w-md">
				<input
				type="range"
				required
				class="range range-sm w-full"
				bind:value={assistant.googleSafetyThreshold}
				step={1}
				min={0}
				max={3}
				disabled={!edit}
				{onchange} />
			</div>
			<p>Insensitive</p>
		</div>
	</div>
	{/if}

</div>