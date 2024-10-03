<script lang="ts">
	import dbg from 'debug';
	const debug = dbg('app:ui:components:MediaPreview');

	export let media: MediaInterface;

	let progressBar: HTMLProgressElement;

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

	// Update progress bar based on video time
	function updateProgressBar(event: Event) {
		const video = event.currentTarget as HTMLVideoElement;
		if (progressBar) {
			const percentage = (video.currentTime / video.duration) * 100;
			progressBar.value = percentage;
		}
	}
	debug('media', media);
	// if (media.file) debug(URL.createObjectURL(media.file));

	let isHovered = false;

	let thumbnailURL: string;
	$: {
		if (media.thumbnail?.file) {
			thumbnailURL = URL.createObjectURL(media.thumbnail.file);
		} else if (media.resized?.file) {
			thumbnailURL = URL.createObjectURL(media.resized.file);
		} else if (media.original?.file) {
			thumbnailURL = URL.createObjectURL(media.original.file);
		}
	}


</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="relative flex h-32 w-32 flex-col justify-start gap-2 rounded-sm"
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={() => (isHovered = false)}>
	{#if media.type === 'video'}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			class="grow object-cover"
			on:mousemove={(event) => handleVideoSeek(event)}
			on:mouseleave={handleVideoStop}
			on:timeupdate={updateProgressBar}>
			<source src={URL.createObjectURL(media.url)} type={media.mimeType} />
			Your browser does not support the video tag.
		</video>
		<progress
			bind:this={progressBar}
			class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
			value={0}
			max={100}></progress>
	{:else if media.type === 'audio'}
		TODO: Audio
	{:else}
		<img src={thumbnailURL} alt={media.filename} class="object-contain h-32 w-32 border grow" />
	{/if}

	<label class="absolute right-1 top-1 z-30">
		<input type="checkbox" class="checkbox checkbox-sm" />
	</label>
	<div class="break-all text-sm"></div>
</div>
