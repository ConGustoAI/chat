<script lang="ts">
	import { MediaEditor, MediaPreview } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';
	import { PlusCircle, Upload } from 'lucide-svelte';

	import { APIupsertFile, APIupsertMedia } from '$lib/api';
	import { putFile } from '$lib/files_client';
	import { populateMedia } from '$lib/media_utils';
	import { assert } from '$lib/utils';
	import dbg from 'debug';
	import { onMount } from 'svelte';
	const debug = dbg('app:ui:components:MediaCarousel');

	let media: MediaInterface[] = [];

	let mediaToUpload: MediaInterface[] = [];

	// We use this element to get the natural width/height of the image.
	let fakeImage: HTMLImageElement;

	// // Used for testing
	function makeFakeImage(): MediaInterface {
		// fakeImage.src =
		// fakeImage.src = `/cat.jpg`;

		return {
			userID: 'anon',
			filename: 'cat.jpg',
			type: 'image',
			title: 'Cat',
			original: {
				mimeType: 'image/jpeg',
				userID: 'anon',
				size: 1024 * 1024,
				url: `https://cataas.com/cat?d=${Math.floor(Math.random() * 1000)}`
			}
		};
	}

	onMount(async () => {
		// debug('onMount');
		// newMedia = [makeFakeImage()];
		// await populateMedia(newMedia[0]);
		// newMedia = newMedia
		// debug('newMedia', newMedia);
	});

	// let dialog: HTMLDialogElement;

	function typeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' {
		if (mimeType.startsWith('image/')) return 'image';
		if (mimeType.startsWith('video/')) return 'video';
		if (mimeType.startsWith('audio/')) return 'audio';
		throw new Error('Unknown media type');
	}

	async function fileToMedia(file: File): Promise<MediaInterface> {
		if (!$dbUser) throw new Error('User not logged in');

		// fakeImage.src = URL.createObjectURL(file);

		const m: MediaInterface = $state({
			userID: $dbUser.id,
			title: file.name,
			filename: file.name,
			type: typeFromMimeType(file.type),
			original: {
				mimeType: file.type,
				size: file.size,
				userID: $dbUser.id,
				file: file
			}
		});

		await populateMedia(m);
		return m;
	}

	// Handle file input change
	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;

		debug('input.files', input.files);
		if (input.files) {
			const newFiles = Array.from(input.files).filter((file) => {
				// Check if the file has already been uploaded by comparing size and last modified date
				return !$mediaToUpload.some(
					(m) => m.original?.size === file.size && m.original?.file?.lastModified === file.lastModified
				);
			});

			$mediaToUpload = [...$mediaToUpload, ...(await Promise.all(newFiles.map(fileToMedia)))];
			debug('newMedia', mediaToUpload);
		}
	}

	async function uploadFile(file: FileInterface) {
		if (!file.file) throw new Error('File not found');
		debug('uploadFile', file);

		file.status = 'progress';
		file = { ...file, ...(await APIupsertFile(file, true)) };
		assert(file.uploadURL, 'No upload URL returned');
		debug('uploadFile insertion: ', file);

		file = { ...file, ...(await putFile(file)) };
		debug('uploadFile putFile: ', file);

		// Update status
		file = { ...file, ...(await APIupsertFile(file)) };
		debug('uploadFile finished', file);
		return file;
	}

	async function uploadMedia(media: MediaInterface) {
		const uploadPromises = [];

		uploadPromises.push(async () => {
			if (media.original && !media.original.id) {
				media.original = { ...media.original, ...(await uploadFile(media.original)) };
			}
		});

		// Only upload resized if it has changed
		uploadPromises.push(async () => {
			if (
				media.resized &&
				(!media.resized.id ||
					media.resizedHeight != media.newResizedHeight ||
					media.resizedWidth != media.newResizedWidth)
			) {
				media.resized = { ...media.resized, ...(await uploadFile(media.resized)) };
			}
		});

		// Upload thumbnail if it doesn't have an ID
		uploadPromises.push(async () => {
			if (media.thumbnail && !media.thumbnail.id) {
				media.thumbnail.isThumbnail = true;
				media.thumbnail = { ...media.thumbnail, ...(await uploadFile(media.thumbnail)) };
			}
		});

		await Promise.all(uploadPromises.map((p) => p()));

		const updatedMedia = await APIupsertMedia(media);
		debug('media uploaded!', updatedMedia);

		// Apply all fields from updatedMedia to media
		Object.assign(media, updatedMedia);
	}

	async function uploadMultipleMedia(mediaArray: MediaInterface[]) {
		debug('uploadMedia', mediaArray);

		const updatedMedia = await Promise.all(mediaArray.map((m) => uploadMedia(m)));
		debug('All media uploaded!', updatedMedia);
		return updatedMedia;
	}

	$: debug('newMedia', mediaToUpload);

	// Handle drag-and-drop
	// function handleDrop(event: DragEvent) {
	// 	event.preventDefault();
	// 	media = event.dataTransfer?.files || null;
	// 	console.log(media);
	// }

	// 	function handleDragOver(event: DragEvent) {
	// 		event.preventDefault();
	// 	}

	// on:dragover={handleDragOver}
</script>

{#if mediaToUpload}
	<!-- {#if false} -->
	<div class="tabs tabs-lifted h-full min-h-full w-full grow items-start bg-base-200">
		{#each $mediaToUpload as m, i}
			<input
				type="radio"
				name="my_tabs_1"
				role="tab"
				class="tab text-nowrap"
				aria-label="{i + 1}: {m.title}"
				checked={i === 0} />
			<div role="tabpanel" class="tab-content h-full max-h-full min-h-full w-full grow">
				<MediaEditor
					bind:media={m}
					on:change={() => {
						debug('change!');
					}} />
			</div>
		{/each}
	</div>
	<div class="divider my-0 w-full shrink-0"></div>
{/if}

<div
	class="carousel carousel-center h-fit w-full shrink-0 space-x-4 bg-base-200 p-4"
	role="region"
	aria-label="Image upload area">
	<!-- Clickable box for file upload -->
	<button
		class="btn carousel-item btn-outline h-32 w-32 items-center justify-center rounded-sm p-0"
		on:click={() => document.getElementById('fileInput')?.click()}>
		<PlusCircle size={48} />
	</button>

	<!-- Hidden file input -->
	<input id="fileInput" type="file" class="hidden" on:change={handleFileChange} multiple />

	<!-- Display uploaded images or videos -->
	{#if $mediaToUpload.length > 0}
		<button
			class="btn carousel-item btn-outline h-32 w-32 items-center justify-center rounded-sm p-0"
			on:click={async () => {
				await uploadMultipleMedia($mediaToUpload);
				$mediaToUpload = $mediaToUpload;
			}}>
			<Upload size={48} />
		</button>

		{#each $mediaToUpload as m}
			<div class="carousel-item">
				<MediaPreview media={m} />
			</div>
		{/each}
	{/if}
</div>
<!-- </div> -->
<!--
<dialog
	bind:this={dialog}
	id="my_modal_1"
	class="modal fixed inset-1 flex h-full w-full flex-col items-center justify-center bg-red-100 opacity-10"
	open={newMedia.length > 0}>
</dialog> -->
