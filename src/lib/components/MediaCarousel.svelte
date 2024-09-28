<script lang="ts">
	import { PlusCircle } from 'lucide-svelte';
	import { MediaPreview, MediaEditor } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';

	import dbg from 'debug';
	import { on } from 'events';
	import { onMount } from 'svelte';
	const debug = dbg('app:ui:components:MediaCarousel');

	let media: MediaInterface[] = [];
	let newMedia: MediaInterface[] = []

	// We use this element to get the natural width/height of the image.
	let fakeImage: HTMLImageElement;

	// // Used for testing
	// function makeFakeImage(): MediaInterface {
	// 	// fakeImage.src = `https://cataas.com/cat?d=${Math.floor(Math.random() * 1000)}`;
	// 	fakeImage.src = `/cat.jpg`;

	// 	return {
	// 		userID: 'anon',
	// 		filename: 'cat.jpg',
	// 		type: 'image',
	// 		title: 'Cat',
	// 		orignal: {
	// 			mimeType: 'image/jpeg',
	// 			mediaID: 'fake',
	// 			userID: 'anon',
	// 			filesize: 1024*1024,
	// 			width: fakeImage.naturalWidth,
	// 			height: fakeImage.naturalHeight,
	// 			url: fakeImage.src,
	// 		}
	// 	}
	// }

	onMount(() => {
		debug('onMount');
		// newMedia = [makeFakeImage()];
	});


	let dialog: HTMLDialogElement;

	function typeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' {
		if (mimeType.startsWith('image/')) return 'image';
		if (mimeType.startsWith('video/')) return 'video';
		if (mimeType.startsWith('audio/')) return 'audio';
		throw new Error('Unknown media type');
	}

	function fileToMedia(file: File): MediaInterface {
		if (!$dbUser) throw new Error('User not logged in');

		fakeImage.src = URL.createObjectURL(file);

		return {
			userID: $dbUser.id,
			title: file.name,
			filename: file.name,
			type: typeFromMimeType(file.type),
			orignal: {
				mimeType: file.type,
				mediaID: file.name,
				userID: $dbUser.id,
				filesize: file.size,
				width: fakeImage.naturalWidth,
				height: fakeImage.naturalHeight,
				url: URL.createObjectURL(file),
				file: file,
			}
		};
	}

	// Handle file input change
	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;

		debug('input.files', input.files);
		if (input.files) {
			newMedia = Array.from(input.files).map(fileToMedia);
			debug('newMedia', newMedia);
			dialog?.showModal();
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


<img bind:this={fakeImage} src="" alt="cat" class="h-full w-full object-contain hidden" />

<!-- on:drop={handleDrop} -->
<div
	class="carousel carousel-center w-full space-x-4 rounded-box bg-base-200 p-4"
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
	<!-- {#each media ? Array.from(media) : [] as m }
		<div class="carousel-item">
			<MediaPreview media={m} />
		</div>
	{/each} -->
</div>

<dialog
	bind:this={dialog}
	id="my_modal_1"
	class="modal fixed inset-1 flex h-full w-full flex-col items-center justify-center bg-red-100 opacity-10"
	open={newMedia.length > 0}>

	<div role="tablist" class="grid-cols-99 tabs tabs-lifted h-2/3 max-h-[66.6%] w-2/3 items-start bg-blue-600">
		{#if newMedia}
			{#each Array.from(newMedia) as m, i}
				<input
					type="radio"
					name="my_tabs_1"
					role="tab"
					class="tab text-nowrap"
					aria-label={m.title}
					checked={i === 0} />
				<div role="tabpanel" class="tab-content h-full min-h-0 bg-gray-600 p-1">
					<MediaEditor bind:media={m} />
				</div>
			{/each}
		{/if}
	</div>

</dialog>
