<script lang="ts">
	import { Login } from '$lib/components';

	export let form;
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="modal-box w-fit">
		<Login {form} />
	</div>
</div>
