<script lang="ts">

	import { APIupsertMedia } from '$lib/api';
	import { A } from '$lib/appstate.svelte';
	import {
		GrowInput,
		MediaAudioControls,
		MediaImageControls,
		MediaPDFControls,
		PDFImageViewer,
		PDFViewer
	} from '$lib/components';
	import {
		assistantSupportsMedia,
		mediaUpdateText
	} from '$lib/utils/media_utils.svelte';
	import { assert, isPublicPage } from '$lib/utils/utils';

	import dbg from 'debug';
	import MediaVideoControls from './MediaVideoControls.svelte';
	import VideoImageViewer from './VideoImageViewer.svelte';
	const debug = dbg('app:ui:components:MediaEditor');

	// let progressBar: HTMLProgressElement;

	// function isVideo(media: MediaInterface) {
	// 	return media.type === 'video';
	// }

	async function updateMediaMetadata() {
		// only update media that has been saved (uploaded) before.
		if (A.mediaEditing?.id) {
			await APIupsertMedia(A.mediaEditing);
		}
	}

	// let displayedImageURL: string | undefined = $state();

	let displayedImageURL: string | undefined = $state(undefined);

	$effect(() => {
		if (['image', 'video'].includes(A.mediaEditing?.type ?? '')) {
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

	let currentAssistant: AssistantInterface | undefined = $derived.by(() => {
		return A.assistants[A.conversation?.assistantID ?? 'none'];
	});

	$effect(() => {
		debug('mediaEditing', $state.snapshot(A.mediaEditing));

		if (A.mediaEditing) {
			if (
				A.mediaEditing.type === 'pdf' &&
				!A.mediaEditing.PDFAsImages &&
				!A.mediaEditing.PDFAsDocument &&
				!A.mediaEditing.PDFAsFile &&
				(!currentAssistant || currentAssistant.images)
			) {
				A.mediaEditing.PDFAsImages = true;
			}

			if (
				A.mediaEditing.type === 'video' &&
				!A.mediaEditing.videoAsImages &&
				!A.mediaEditing.videoAsFile &&
				(!currentAssistant || currentAssistant.images)
			) {
				A.mediaEditing.videoAsImages = true;
			}
		}
	});

	let mediaSupported = $derived.by(() => {
		assert(A.mediaEditing, 'No media editing');
		if (!A.conversation?.assistantID) return true;
		const assistant = A.assistants[A.conversation.assistantID];
		if (!assistant) return true; // Can't fing assistant - assume it supports this media.

		return assistantSupportsMedia(assistant, A.mediaEditing);
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
			{:else if A.mediaEditing?.type === 'audio'}
				<div class="flex h-full max-h-full grow flex-col overflow-auto p-2">
					<audio class="w-full shrink grow" controls>
						<source src={A.mediaEditing.original.url} />
						Your browser does not support the audio tag.
					</audio>
				</div>
			{:else if A.mediaEditing?.type === 'video'}
				<div role="tablist" class="tabs tabs-lifted h-full w-full">
					<input
						type="radio"
						name="video-tabs"
						role="tab"
						class="tab text-nowrap [--tab-border-color:--tw-content]"
						aria-label="Video"
						checked />
					<div class="tab-content h-full overflow-auto">
						<!-- svelte-ignore a11y_media_has_caption -->
						<video class="shrink grow overflow-hidden object-contain" controls>
							<source src={A.mediaEditing.original.url} type={A.mediaEditing.original.mimeType} />
							Your browser does not support the video tag.
						</video>
					</div>
					<input
						type="radio"
						name="video-tabs"
						role="tab"
						class="tab text-nowrap"
						aria-label="As images"
						disabled={!A.mediaEditing.videoAsImages} />
					<div class="tab-content h-full overflow-auto">
						<VideoImageViewer media={A.mediaEditing} />
					</div>
				</div>
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
					<input type="radio" name="pdf-tabs" role="tab" class="tab text-nowrap" aria-label="As document" disabled />
					<div class="tab-content h-full overflow-auto">
						<!-- <PDFDocumentViewer media={A.mediaEditing} /> -->
					</div>
				</div>
			{/if}

			<div
				class="flex min-w-fit shrink-0 grow-0 flex-col items-end justify-start gap-1 overflow-visible border-t p-1 md:border-l md:border-t-0">
				{#if !mediaSupported}
					<div class="w-full text-center text-error">
						<p>Media type not supported</p>
					</div>
				{/if}

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
							onchange={async () => {
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
				{:else if A.mediaEditing.type === 'audio'}
					<MediaAudioControls />
				{:else if A.mediaEditing.type === 'video'}
					<MediaVideoControls />
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
