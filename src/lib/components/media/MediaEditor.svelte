<script lang="ts">
	import { Check } from 'lucide-svelte';

	import { APIupsertMedia } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import {
		GrowInput,
		MediaImageControls,
		MediaPDFControls,
		PDFDocumentViewer,
		PDFImageViewer,
		PDFViewer
	} from '$lib/components';
	import { mediaResizeFromPreset, mediaUpdateText, resizePresets } from '$lib/utils/media_utils.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';

	import dbg from 'debug';
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

	// let displayedImageURL: string | undefined = $state();

	let displayedImageURL: string | undefined = $state(undefined);

	$effect(() => {
		if (A.mediaEditing?.type === 'image') {
			if (A.mediaEditing?.transformed) {
				debug('displayedImageURL: Picking resized');
				A.mediaEditing.transformed.then((r) => (displayedImageURL = r.url));
				// displayedImageURL =
			} else if (A.mediaEditing?.original?.url) {
				debug('displayedImageURL: Picking original');
				displayedImageURL = A.mediaEditing.original.url;
			} else {
				debug('thumbnailURL: No preview URL available');
				displayedImageURL = undefined;
			}
		}
	});

	let titleUpdating: boolean = $state(false);
	let textNeedsSave = $state(false);

	$effect(() => {
		if (A.mediaEditing) {
			if (!A.mediaEditing.PDFAsImages && !A.mediaEditing.PDFAsDocument && !A.mediaEditing.PDFAsFile) {
				A.mediaEditing.PDFAsImages = true;
			}
		}
	});
</script>

<dialog class="modal inset-0" open={!!A.mediaEditing}>
	<div
		class="modal-box relative flex h-[80vh] w-[95vw] min-w-[95vw] flex-col overflow-visible rounded-sm border p-1 md:flex-row lg:w-[80vw] lg:min-w-[80vw]"
		class:mb-60={A.debug}>
		{#if A.mediaEditing}
			{#if A.mediaEditing?.type === 'image'}
				<img
					src={displayedImageURL}
					alt={A.mediaEditing.title}
					class="pixilated bg-checkered shrink grow self-stretch overflow-hidden object-contain" />
			{:else if A.mediaEditing?.type === 'text'}
				<div class="flex h-full max-h-full grow flex-col overflow-auto p-2">
					<GrowInput
						class="tab-size-4 font-mono"
						spellcheck={false}
						bind:value={A.mediaEditing.text}
						oninput={() => (textNeedsSave = true)}
						disabled={isPublicPage()} />
				</div>
			{:else if A.mediaEditing?.type === 'pdf'}
				<div role="tablist" class="tabs tabs-lifted h-full w-full">
					<input
						type="radio"
						name="pdf-tabs"
						role="tab"
						class="tab text-nowrap [--tab-border-color:--tw-content]"
						aria-label="Original"
						checked />
					<div class="tab-content h-full overflow-auto">
						<!-- <PDFViewer media={A.mediaEditing} /> -->
						<PDFViewer media={A.mediaEditing} />
					</div>
					<input
						type="radio"
						name="pdf-tabs"
						role="tab"
						class="tab text-nowrap"
						aria-label="As images"
						disabled={!A.mediaEditing.PDFAsImages} />
					<div class="tab-content h-full overflow-auto">
						<PDFImageViewer media={A.mediaEditing} />
					</div>
					<input
						type="radio"
						name="pdf-tabs"
						role="tab"
						class="tab text-nowrap"
						aria-label="As document"
						disabled/>
					<div class="tab-content h-full overflow-auto">
						<!-- <PDFDocumentViewer media={A.mediaEditing} /> -->
					</div>
				</div>
			{/if}

			<div
				class="flex min-w-fit shrink-0 grow-0 flex-col items-end justify-start gap-1 overflow-visible border-t p-1 md:border-l md:border-t-0">
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
					<MediaImageControls />
				{:else if A.mediaEditing.type === 'pdf'}
					<MediaPDFControls />
				{:else if A.mediaEditing.type === 'text'}
					{#if !isPublicPage()}
						<button
							class="btn btn-outline btn-sm mb-auto"
							disabled={!textNeedsSave}
							onclick={async () => {
								assert(A.mediaEditing);
								await mediaUpdateText(A.mediaEditing);
							}}>Save changes</button>
					{:else}
						<div class="m-auto grow"></div>
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
