<script lang="ts">
	export let file: File;

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
    console.log(file);
    console.log(URL.createObjectURL(file));

	let isHovered = false;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="relative flex h-32 w-32 flex-col gap-2 rounded-sm justify-start"
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={() => (isHovered = false)}>
	{#if isVideo(file)}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			class="grow object-cover"
			on:mousemove={(event) => handleVideoSeek(event)}
			on:mouseleave={handleVideoStop}
			on:timeupdate={updateProgressBar}>
			<source src={URL.createObjectURL(file)} type={file.type} />
			Your browser does not support the video tag.
		</video>
		<progress
			bind:this={progressBar}
			class="progress progress-error absolute bottom-0 z-20 h-1 rounded-none"
			value={0}
			max={100}></progress>
	{:else}
		<img src={URL.createObjectURL(file)} alt={file.name} class=" object-contain" />
	{/if}

	<label class="absolute right-1 top-1 z-30">
		<input type="checkbox" class="checkbox checkbox-sm" />
	</label>
	{#if isHovered}
		<input type="text" class="input input-xs input-bordered absolute bottom-1 w-full" />
	{:else}
        <div class="text-sm break-all"></div>
</div>
