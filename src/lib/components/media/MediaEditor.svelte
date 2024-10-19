<script lang="ts">
	import { Check } from 'lucide-svelte';

	import { APIupsertMedia, mediaInterfaceFilter } from '$lib/api';
	import { mediaResizeFromPreset, mediaUpdateText, resizePresets } from '$lib/utils/media_utils.svelte';
	import dbg from 'debug';
	import GrowInput from '../GrowInput.svelte';
	import { A } from '$lib/appstate.svelte';
	import { assert } from '$lib/utils/utils';

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

<dialog class="modal" open={!!A.mediaEditing}>
	<div class="modal-box max-w-none flex w-[66%] h-[66%] rounded-sm grow items-stretch justify-start overflow-hidden border p-1">
		{#if A.mediaEditing}
			{#if A.mediaEditing?.type === 'image'}
				<div class="flex-grow-1 mx-auto flex-shrink-0">
					<img
						src={displayedImageURL}
						alt={A.mediaEditing.title}
						class="pixilated bg-checkered mx-auto h-full max-h-full max-w-full object-contain" />
				</div>

				<!-- <div class="backgroud-blue-300 ml-auto w-full grow bg-blue-300"></div> -->

				<div class="flex grow-0 flex-col items-end gap-1 border-l p-1">
					<div class="flex items-baseline justify-start gap-2">
						<p class="label mr-auto">Title</p>
						{#if titleUpdating}
							<span class="loading loading-sm"></span>
						{/if}

						<input
							type="text"
							class="input input-sm input-bordered w-48 justify-self-end"
							bind:value={A.mediaEditing.title}
							onchange={async (e) => {
								titleUpdating = true;
								await updateMediaMetadata();
								titleUpdating = false;
							}} />
					</div>

					<div class="flex items-baseline justify-between gap-2">
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

					<div class="mt-auto flex flex-col items-end justify-self-end">
						<div class="flex max-h-32 w-32 items-center bg-black">
							<img src={thumbnailURL} alt="preview" class="bg-checkered border object-contain" />
						</div>
						<p class="">{A.mediaEditing.filename}</p>
						<p>Media original size: {A.mediaEditing.originalWidth}x{A.mediaEditing.originalHeight}</p>
						<p>Media resized size: {A.mediaEditing.resizedWidth}x{A.mediaEditing.resizedHeight}</p>
						{#if (A.mediaEditing.resizedWidth ?? 0) > (A.mediaEditing.originalWidth ?? 0) || (A.mediaEditing.resizedHeight ?? 0) > (A.mediaEditing.originalHeight ?? 0)}
							<p class="text-warning">Image upscaled</p>
						{/if}
					</div>
				</div>
			{:else if A.mediaEditing?.type === 'text'}
				<div class="flex h-full max-h-full grow flex-col p-2">
					<GrowInput bind:value={A.mediaEditing.original!.text} oninput={() => (textNeedsSave = true)} />
				</div>
				<div class="flex grow-0 flex-col items-end gap-1 border-l p-1">
					<div class="flex items-baseline justify-start gap-2">
						<p class="label mr-auto">Title</p>
						{#if titleUpdating}
							<span class="loading loading-sm"></span>
						{/if}

						<input
							type="text"
							class="input input-sm input-bordered w-48 justify-self-end"
							bind:value={A.mediaEditing.title}
							onchange={async (e) => {
								titleUpdating = true;
								await updateMediaMetadata();
								titleUpdating = false;
							}} />
					</div>
					<button
						class="btn btn-outline btn-sm"
						disabled={!textNeedsSave}
						onclick={async () => {
							assert(A.mediaEditing);
							await mediaUpdateText(A.mediaEditing);
						}}>Save changes</button>
				</div>
			{/if}
		{/if}
		<!-- <form method="dialog" class="modal-backdrop"> -->
		<!-- </form> -->
		<!-- <div class="flex gap-2">
			<h2 class="text-lg font-bold">{media.title}</h2>
			<button class="btn btn-sm btn-outline" on:click={() => (titleEdit = !titleEdit)}>Edit</button>
		</div> -->
	</div>
	<button
		class="modal-backdrop"
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
