<script lang="ts">
	let { messageType, message = $bindable(undefined) }: { messageType: 'error' | 'warning' | 'info' | 'success', message?: string } = $props();
</script>

<button
	aria-label="Close error message"
	class="text-{messageType} self-start"
	onclick={() => {
		message = '';
	}}
	>{message ?? ''}
</button>
