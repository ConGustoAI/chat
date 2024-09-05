<script lang="ts">
	export let messageType: 'error' | 'warning' | 'info' | 'success';
	export let message: string | undefined;
</script>

<button
	class="text-{messageType}"
	on:click={() => {
		message = '';
	}}
	>{message ?? ''}
</button>
