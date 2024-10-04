<script lang="ts">
	import { PlusCircle } from 'lucide-svelte';
	import { MediaPreview, MediaEditor } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';

	import dbg from 'debug';
	import { on } from 'events';
	import { onMount } from 'svelte';
	import { resizeImage } from '$lib/media_utils';
	const debug = dbg('app:ui:components:MediaCarousel');

	let media: MediaInterface[] = [];
	let newMedia: MediaInterface[] = [];

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
		debug('onMount');
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

		const m: MediaInterface = {
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
		};

		await populateMedia(m);
		return m;
	}

	async function populateFile(file: FileInterface) {
		if (!file.file && !file.url) {
			throw new Error('FileInterface must have either file or url');
		}

		if (!file.file && file.url) {
			try {
				const response = await fetch(file.url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const blob = await response.blob();
				file.file = new File([blob], file.url.split('/').pop() || 'file', { type: file.mimeType });
			} catch (error) {
				console.error('Error fetching file:', error);
				throw new Error('Failed to fetch file from URL');
			}
		}

		if (!file.url && file.file) {
			file.url = URL.createObjectURL(file.file);
		}
	}

	async function populateMedia(media: MediaInterface) {
		if (!media.original) throw new Error('MediaInterface must have an original file');
		if (media.original) await populateFile(media.original);
		if (media.thumbnail) await populateFile(media.thumbnail);
		if (media.resized) await populateFile(media.resized);
		if (media.cropped) await populateFile(media.cropped);

		if ((!media.originalWidth || !media.originalHeight) && media.original?.file) {
			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				img.onload = () => {
					media.originalWidth = img.naturalWidth;
					media.originalHeight = img.naturalHeight;
					URL.revokeObjectURL(img.src);
					resolve();
				};
				img.onerror = (error) => {
					URL.revokeObjectURL(img.src);
					reject(new Error('Failed to load image: ' + error));
				};
				if (media.original?.file) {
					img.src = URL.createObjectURL(media.original.file);
				} else {
					reject(new Error('No original file available'));
				}
			});
		}

		if (media.resizedWidth && media.resizedHeight && !media.resized) {
			media.resized = await resizeImage(media.original, media.resizedWidth, media.resizedHeight);
		}

		if (!media.thumbnail) {
			media.thumbnail = await resizeImage(media.original, 128, 128);
		}
	}

	// Handle file input change
	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;

		debug('input.files', input.files);
		if (input.files) {
			newMedia = await Promise.all(Array.from(input.files).map(fileToMedia));
			debug('newMedia', newMedia);
			// dialog?.showModal();
		}
	}

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

<!-- {#if newMedia} -->
{#if false}
	<div class="tabs tabs-lifted h-full min-h-full w-full grow items-start bg-base-200">
		{#each newMedia as m, i}
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
	{#if newMedia.length > 0}
		{#each newMedia as m}
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
