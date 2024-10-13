<script lang="ts">
	import { MediaEditor, MediaPreview } from '$lib/components';
	import { A } from '$lib/appstate.svelte';
	import { PlusCircle, Upload } from 'lucide-svelte';

	import { APIupsertConversation, APIupsertFile, APIupsertMedia, mediaInterfaceFilter } from '$lib/api';
	import { putFile } from '$lib/utils/files_client.svelte';
	import { mediaCreateThumbnail, syncMediaFileURLs, uploadChangedMedia, uploadConversationMedia } from '$lib/utils/media_utils.svelte';
	import { assert } from '$lib/utils/utils';
	import dbg from 'debug';
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	const debug = dbg('app:ui:components:MediaCarousel');

	// // Used for testing
	function makeFakeImage(): MediaInterface {
		// fakeImage.src =
		// fakeImage.src = `/cat.jpg`;

		return {
			active: true,
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
		if (!A.dbUser) throw new Error('User not logged in');

		// fakeImage.src = URL.createObjectURL(file);

		const m: MediaInterface = {
			active: true,
			userID: A.dbUser.id,
			title: file.name,
			filename: file.name,
			type: typeFromMimeType(file.type),
			original: {
				mimeType: file.type,
				size: file.size,
				userID: A.dbUser.id,
				file: file
			}
		};

		await syncMediaFileURLs(m);
		return m;
	}

	// Handle file input change
	async function handleFileChange(event: Event) {
		if (!A.conversation) throw new Error('Conversation missing');

		const input = event.target as HTMLInputElement;

		debug('input.files', input.files);
		if (input.files) {
			if (!A.conversation.media) A.conversation.media = [];

			const newFiles = Array.from(input.files).filter((file) => {
				// Check if the file has already been uploaded by comparing size and last modified date
				return !A.conversation?.media?.some(
					(m) => m.original?.size === file.size && m.original?.file?.lastModified === file.lastModified
				);
			});

			const newMedia = await Promise.all(newFiles.map(fileToMedia));
			// await Promise.all(newMedia.map(mediaCreateThumbnail));

			A.conversation.media.push(...newMedia);
			debug('Files added: ', $state.snapshot(A.conversation));
		}
	}



	// let _ = $derived.by(() => debug('A.conversation', A.conversation));

	// $inspect(A.conversation).with((c, t) => {
	// 	debug('A.conversation', c, t);
	// });

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

<!-- {#if mediaToUpload}
	<div class="tabs tabs-lifted h-full min-h-full w-full grow items-start bg-base-200">
		{#each mediaToUpload as m, i}
			<input
				type="radio"
				name="my_tabs_1"
				role="tab"
				class="tab text-nowrap"
				aria-label="{i + 1}: {m.title}"
				checked={i === 0} />
			<div role="tabpanel" class="tab-content h-full max-h-full min-h-full w-full grow">
				<MediaEditor
					bind:media={mediaToUpload[i]}
					onchange={() => {
						debug('change!');
					}} />
			</div>
		{/each}
	</div>
	<div class="divider my-0 w-full shrink-0"></div>
{/if} -->

<div
	class="carousel carousel-center h-fit w-full shrink-0 space-x-4 bg-base-200 p-4"
	role="region"
	aria-label="Image upload area">
	<!-- Clickable box for file upload -->
	<div class="flex flex-col gap-3">
		<button
			class="btn carousel-item btn-outline h-14 w-14 items-center justify-center rounded-sm p-0"
			onclick={() => document.getElementById('fileInput')?.click()}>
			<PlusCircle size={32} />
		</button>
		<button
			class="btn carousel-item btn-outline h-14 w-14 items-center justify-center rounded-sm p-0"
			disabled={!A.conversation?.media?.length}
			onclick={async () => {
				await uploadConversationMedia();
			}}>
			<Upload size={32} />
		</button>
	</div>
	<!-- Hidden file input -->
	<input id="fileInput" type="file" class="hidden" onchange={handleFileChange} multiple />

	<!-- Display uploaded images or videos -->
	{#if A.conversation?.media}
		{#each A.conversation?.media as m, i}
			<div class="carousel-item">
				<MediaPreview bind:media={A.conversation.media[i]} />
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
