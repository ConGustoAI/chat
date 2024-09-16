<script lang="ts">
	import { PlusCircle } from 'lucide-svelte';
	import { MediaPreview } from '$lib/components';
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

// 	function handleDragOver(event: DragEvent) {
// 		event.preventDefault();
// 	}

// on:dragover={handleDragOver}
</script>

<div
	class="carousel carousel-center w-full space-x-4 rounded-box bg-base-200 p-4"
	on:drop={handleDrop}
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
			<MediaPreview {file} />
		</div>
	{/each}
</div>
