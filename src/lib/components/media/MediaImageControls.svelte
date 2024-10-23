<script lang="ts">
	import { A } from '$lib/appstate.svelte';
	import { mediaResizeFromPreset, resizePresets } from '$lib/utils/media_utils.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';

	import dbg from 'debug';
	import { Check } from 'lucide-svelte';
	const debug = dbg('app:ui:components:MediaImageControls');

	// Bound to the rezie control elements.
	let selectedResizePreset = $state('original');
	let resizeWidth: number | undefined = $state();
	let resizeHeight: number | undefined = $state();

	let thumbnailURL: string | undefined = $state(undefined);

	$effect(() => {
		if (A.mediaEditing) {
			if (A.mediaEditing.thumbnail) {
				debug('thumbnailURL: Picking thumbnail');
				A.mediaEditing.thumbnail.then((t) => (thumbnailURL = t.url));
			} else if (A.mediaEditing.original && A.mediaEditing.type === 'image') {
				debug('thumbnailURL: Picking original');
				thumbnailURL = A.mediaEditing.original.url;
			} else {
				debug('thumbnailURL: No preview URL available');
				thumbnailURL = undefined;
			}
		}
	});
</script>

{#if A.mediaEditing}
	{#if !isPublicPage()}
		<div class="flex items-baseline gap-2">
			<p class="label">Size</p>
			<select
				class="select select-bordered select-sm w-48"
				bind:value={selectedResizePreset}
				onchange={async () => {
					debug('resizePreset', selectedResizePreset);
					assert(A.mediaEditing);
					await mediaResizeFromPreset(A.mediaEditing, selectedResizePreset);
				}}>
				{#each Object.keys(resizePresets) as preset}
					<option value={preset}>{resizePresets[preset].label}</option>
				{/each}
			</select>
		</div>
		{#if selectedResizePreset === 'custom'}
			<div class="flex items-center justify-between gap-2">
				<p class="label">Resolution</p>
				<div class="flex w-48 items-baseline justify-between gap-2">
					<input
						type="number"
						class="input input-sm input-bordered w-full shrink"
						placeholder="W"
						bind:value={resizeWidth} />
					x
					<input type="number" class="input input-sm input-bordered w-full" placeholder="H" bind:value={resizeHeight} />
				</div>
			</div>
			<button
				class="align-self-end btn btn-outline btn-sm w-fit"
				onclick={async () => {
					assert(A.mediaEditing);
					await mediaResizeFromPreset(A.mediaEditing, selectedResizePreset, resizeHeight, resizeHeight);
				}}><Check /></button>
		{/if}
	{/if}

	<div class="mt-auto flex flex-col items-end">
		<div class="flex max-h-32 w-32 items-center bg-black">
			<img src={thumbnailURL} alt="preview" class="bg-checkered border object-contain" />
		</div>
		<p class="">{A.mediaEditing.filename}</p>
		<p>Original: {A.mediaEditing.originalWidth}x{A.mediaEditing.originalHeight}</p>
		{#if A.mediaEditing.resizedWidth && A.mediaEditing.resizedHeight}
			<p>Resized: {A.mediaEditing.resizedWidth}x{A.mediaEditing.resizedHeight}</p>
		{/if}
		{#if (A.mediaEditing.resizedWidth ?? 0) > (A.mediaEditing.originalWidth ?? 0) || (A.mediaEditing.resizedHeight ?? 0) > (A.mediaEditing.originalHeight ?? 0)}
			<p class="text-warning">Image upscaled</p>
		{/if}
	</div>
{/if}
