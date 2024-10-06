<script lang="ts">
	import { Check } from 'lucide-svelte';

	import { APIupsertMedia, MediaInterfaceFilter } from '$lib/api';
	import { mediaResizeOriginal, resizePresets } from '$lib/media_utils';
	import dbg from 'debug';

	const debug = dbg('app:ui:components:MediaEditor');

	export let media: MediaInterface;
	let progressBar: HTMLProgressElement;

	function isVideo(media: MediaInterface) {
		return media.type === 'video';
	}

	async function updateMediaMetadata() {
		 // only update media that has been saved (uploaded) before.
		if (media.id) {
			media = await APIupsertMedia(media);
		}
	}

	// Bound to the rezie control elements.
	let selectedResizePreset = 'original';
	let resizeWidth: number;
	let resizeHeight: number;

	let displayedImageURL: string;
	$: {
		debug('displayedImageURL', media)
		if (displayedImageURL) {
			URL.revokeObjectURL(displayedImageURL);
		}
		if (
			media.resized?.file &&
			(media.newResizedWidth !== media.originalWidth || media.newResizedHeight !== media.originalHeight) &&
			(selectedResizePreset !== 'original')
		) {
			debug('displaying resized image');
			displayedImageURL = URL.createObjectURL(media.resized.file);
		} else if (media.original?.file) {
			debug('displaying original image');
			displayedImageURL = URL.createObjectURL(media.original.file);
		}
		debug('displayedImageURL', displayedImageURL);
	}

	$: debug('media', media);

	let titleUpdating = false;
</script>

<div class="flex h-[100vh] max-h-full min-h-full shrink-0 grow">
	<!-- <div class="flex h-full max-h-full min-h-0 shrink flex-col items-start p-2"> -->
	<img
		src={displayedImageURL}
		alt={media.title}
		class="pixilated ml-auto h-full max-h-full min-h-full shrink grow justify-self-center object-contain align-middle" />

	<div class="divider divider-horizontal mx-1 grow-0 px-1"></div>

	<div class="m-1 flex grow-0 flex-col items-end gap-1">
		<div class="flex items-baseline justify-start gap-2">
			<p class="label mr-auto">Title</p>
			{#if titleUpdating}
				<span class="loading loading-sm"></span>
			{/if}

			<input
				type="text"
				class="input input-sm input-bordered w-48 justify-self-end"
				bind:value={media.title}
				on:change={async (e) => {
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
				on:change={async () => {
					debug('resizePreset', selectedResizePreset);
					await mediaResizeOriginal(media, selectedResizePreset);
					media = media;
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
				on:click={async () => {
					await mediaResizeOriginal(media, selectedResizePreset, resizeHeight, resizeHeight);
				}}><Check /></button>
		{/if}

		<div class="mt-auto flex flex-col items-end justify-self-end">
			<img src={media.thumbnail?.url} alt="preview" class="h-32 w-32 border object-contain" />
			<p class="">{media.filename}</p>
			<!-- <p>Original size: {hiddenImageOriginal?.naturalWidth}x{hiddenImageOriginal?.naturalHeight}</p>
			<p>Resized size: {hiddenImageResized?.naturalWidth}x{hiddenImageResized?.naturalHeight}</p> -->
			<p>Media original size: {media.originalWidth}x{media.originalHeight}</p>
			<p>Media resized size: {media.resizedWidth}x{media.resizedHeight}</p>
			<p>Media new resized size: {media.newResizedWidth}x{media.newResizedHeight}</p>
		</div>
	</div>

	<!-- <div class="flex gap-2">
        <h2 class="text-lg font-bold">{media.title}</h2>
        <button class="btn btn-sm btn-outline" on:click={() => (titleEdit = !titleEdit)}>Edit</button>
    </div> -->
</div>

<!-- svelte-ignore a11y-no-static-element-interactions -->
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
