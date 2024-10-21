<script lang="ts">
	import { Check, X } from 'lucide-svelte';

	import { APIupsertMedia, mediaInterfaceFilter } from '$lib/api';
	import { mediaResizeFromPreset, mediaUpdateText, resizePresets } from '$lib/utils/media_utils.svelte';
	import dbg from 'debug';
	import GrowInput from '../GrowInput.svelte';
	import { A } from '$lib/appstate.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';

	const debug = dbg('app:ui:components:MediaEditor');

	let progressBar: HTMLProgressElement;

	function isVideo(media: MediaInterface) {
		return media.type === 'video';
	}

	async function updateMediaMetadata() {
		// only update media that has been saved (uploaded) before.
		if (A.mediaEditing?.id) {
			await APIupsertMedia(A.mediaEditing);
		}
	}

	// Bound to the rezie control elements.
	let selectedResizePreset = $state('original');
	let resizeWidth: number | undefined = $state();
	let resizeHeight: number | undefined = $state();

	// let displayedImageURL: string | undefined = $state();

	let displayedImageURL = $derived.by(() => {
		if (A.mediaEditing?.resized?.url) {
			debug('displayedImageURL: Picking rezied');
			return A.mediaEditing.resized.url;
		} else if (A.mediaEditing?.original?.url) {
			debug('displayedImageURL: Picking original');
			return A.mediaEditing.original.url;
		} else {
			debug('thumbnailURL: No preview URL available');
			return undefined;
		}
	});

	let thumbnailURL = $derived.by(() => {
		if (A.mediaEditing?.thumbnail?.url) {
			debug('thumbnailURL: Picking thumbnail');
			return A.mediaEditing.thumbnail.url;
		} else if (A.mediaEditing?.original?.url) {
			debug('thumbnailURL: Picking original');
			return A.mediaEditing.original.url;
		} else {
			debug('thumbnailURL: No preview URL available');
			return undefined;
		}
	});

	let titleUpdating: boolean = $state(false);

	let textNeedsSave = $state(false);
</script>

<dialog class="modal inset-0" open={!!A.mediaEditing}>
	<div
		class="modal-box relative flex h-[80vh] w-[95vw] min-w-[95vw] flex-col rounded-sm border p-1 md:flex-row md:overflow-hidden lg:w-[80vw] lg:min-w-[80vw]">
		{#if A.mediaEditing}
			{#if A.mediaEditing?.type === 'image'}
				<img
					src={displayedImageURL}
					alt={A.mediaEditing.title}
					class="pixilated bg-checkered shrink grow self-stretch overflow-hidden object-contain" />
			{:else if A.mediaEditing?.type === 'text'}
				<div class="flex h-full max-h-full grow flex-col p-2 overflow-scroll">
					<GrowInput
						bind:value={A.mediaEditing.original!.text}
						oninput={() => (textNeedsSave = true)}
						disabled={isPublicPage()} />
				</div>
			{/if}

			<div
				class="flex min-w-fit shrink-0 grow-0 flex-col items-end gap-1 overflow-hidden border-t p-1 md:border-l md:border-t-0 justify-start">
				<div class="flex items-baseline gap-2">
					<p class="label mr-auto">Title:</p>
					{#if titleUpdating}
						<span class="loading loading-sm"></span>
					{/if}

					{#if !isPublicPage()}
						<input
							type="text"
							class="input input-sm input-bordered w-48 justify-self-end"
							bind:value={A.mediaEditing.title}
							onchange={async (e) => {
								titleUpdating = true;
								await updateMediaMetadata();
								titleUpdating = false;
							}} />
					{:else}
						<p>{A.mediaEditing.title}</p>
					{/if}
				</div>

				{#if A.mediaEditing.type === 'image'}
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
									<input
										type="number"
										class="input input-sm input-bordered w-full"
										placeholder="H"
										bind:value={resizeHeight} />
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
				{:else if A.mediaEditing.type === 'text'}
					{#if !isPublicPage()}
						<button
							class="btn btn-outline btn-sm mb-auto"
							disabled={!textNeedsSave}
							onclick={async () => {
								assert(A.mediaEditing);
								await mediaUpdateText(A.mediaEditing);
							}}>Save changes</button>
					{/if}
				{/if}
				<button
					class="btn btn-outline btn-sm justify-self-end bg-base-200 p-1"
					onclick={() => (A.mediaEditing = undefined)}>Close</button>
			</div>
		{/if}
	</div>

	<button
		class="modal-backdrop"
		tabindex="-1"
		onclick={() => {
			debug('asd');
			A.mediaEditing = undefined;
		}}>close</button>
</dialog>
{#if false}
	<div class="flex flex-col justify-start gap-2 rounded-sm">
		<!-- {#if media.type === 'video'}
				<video
					class="grow object-cover"
					on:mousemove={(event) => handleVideoSeek(event)}
					on:mouseleave={handleVideoStop}
					on:timeupdate={updateProgressBar}>
					<source src={URL.createObjectURL(media.file)} type={media.mimeType} />
					Your browser does not support the video tag.
				</video>
				<progress
					bind:this={progressBar}
					class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
					value={0}
					max={100}></progress>
			{:else}
				<img
					src={media.url ?? '#'}
					alt={media.title}
					class="mx-auto my-auto h-[inherit] max-h-[100%] bg-gray-600 object-contain" />
			{/if} -->

		<!-- <div class="tab-content h-[inherit] max-h-[100vh] flex-col justify-center bg-gray-600 p-6">
				<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/08-130Miraflores-NYK_DIANA_-_Flickr_-_Salvador.C.jpg/450px-08-130Miraflores-NYK_DIANA_-_Flickr_-_Salvador.C.jpg" alt="cat" class="h-full w-full object-contain" />

			</div> -->

		<!-- <label class="absolute right-1 top-1 z-30">
				<input type="checkbox" class="checkbox checkbox-sm" />
			</label>
			{#if isHovered}
				<input type="text" class="input input-xs input-bordered absolute bottom-1 w-full" />
			{:else}
				<div class="break-all text-sm"></div>
			{/if} -->
	</div>
{/if}

<style>
	.pixilated {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		-ms-interpolation-mode: nearest-neighbor;
	}
</style>
