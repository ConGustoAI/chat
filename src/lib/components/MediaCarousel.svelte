<script lang="ts">
	import { PlusCircle } from 'lucide-svelte';
	let files: FileList | null = null;

	// Handle file input change
	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		files = input.files;
		console.log(files);
	}

	// Handle drag-and-drop
	function handleDrop(event: DragEvent) {
		event.preventDefault();
		files = event.dataTransfer?.files || null;
		console.log(files);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function isVideo(file: File) {
		return file.type.startsWith('video/');
	}

	// Handle video seek based on mouse position
	function handleVideoSeek(event: MouseEvent) {
		const video = event.currentTarget as HTMLVideoElement;
		const rect = video.getBoundingClientRect();
		const xPos = event.clientX - rect.left;
		const percentage = xPos / rect.width;
		video.currentTime = percentage * video.duration; // Use video.duration
		video.muted = true; // Mute the video
		video.play();
	}

	// Stop video playback when mouse leaves
	function handleVideoStop(event: MouseEvent) {
		const video = event.currentTarget as HTMLVideoElement;
		video.pause();
	}

	// // Helper to handle video stop
	// function handleVideoStop() {
	// 	const video = document.querySelector('video');
	// 	if (video) {
	// 		video.pause();
	// 	}
	// }
</script>

<div
	class="carousel carousel-center w-full space-x-4 rounded-box bg-base-200 p-4"
	on:drop={handleDrop}
	on:dragover={handleDragOver}
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
	{#each files ? Array.from(files) : [] as file (file.name)}
		<div class="carousel-item">
			{#if isVideo(file)}
				<!-- svelte-ignore a11y-media-has-caption -->
				<video
					class="h-32 w-32 rounded-sm object-cover"
					on:mousemove={(event) => handleVideoSeek(event)}
					on:mouseleave={handleVideoStop}>
					<source src={URL.createObjectURL(file)} type={file.type} />
					Your browser does not support the video tag.
				</video>
				<!-- Removed the event parameter from handleVideoStop -->
			{:else}
				<img src={URL.createObjectURL(file)} alt={file.name} class="h-32 w-32 rounded-sm object-contain" />
			{/if}
		</div>
	{/each}
</div>
