<script lang="ts">
	import { PlusCircle } from 'lucide-svelte';
	import { MediaPreview, MediaEditor } from '$lib/components';
	import { dbUser } from '$lib/stores/appstate';

	import dbg from 'debug';
	import { on } from 'events';
	import { onMount } from 'svelte';
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

	onMount(() => {
		debug('onMount');
		newMedia = [makeFakeImage()];
	});

	// let dialog: HTMLDialogElement;

	function typeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' {
		if (mimeType.startsWith('image/')) return 'image';
		if (mimeType.startsWith('video/')) return 'video';
		if (mimeType.startsWith('audio/')) return 'audio';
		throw new Error('Unknown media type');
	}

	function fileToMedia(file: File): MediaInterface {
		if (!$dbUser) throw new Error('User not logged in');

		// fakeImage.src = URL.createObjectURL(file);

		return {
			userID: $dbUser.id,
			title: file.name,
			filename: file.name,
			type: typeFromMimeType(file.type),
			original: {
				mimeType: file.type,
				size: file.size,
				userID: $dbUser.id,
				url: URL.createObjectURL(file),
				file: file
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

{#if newMedia}
	<div class="tabs tabs-lifted h-full min-h-full w-full items-start bg-base-200 grow ">
		{#each newMedia as m, i}
			<input
				type="radio"
				name="my_tabs_1"
				role="tab"
				class="tab text-nowrap"
				aria-label="{i + 1}: {m.title}"
				checked={i === 0} />
			<div role="tabpanel" class="tab-content h-full max-h-full min-h-full w-full grow">
				<MediaEditor bind:media={m} on:change={() => {debug("change!")}}/>
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
	{#each newMedia ? Array.from(newMedia) : [] as m }
		<div class="carousel-item">
			<MediaPreview media={m} />
		</div>
	{/each}
</div>
<!-- </div> -->
<!--
<dialog
	bind:this={dialog}
	id="my_modal_1"
	class="modal fixed inset-1 flex h-full w-full flex-col items-center justify-center bg-red-100 opacity-10"
	open={newMedia.length > 0}>
</dialog> -->
