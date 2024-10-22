<script lang="ts">
	import { A } from '$lib/appstate.svelte';
    import dbg from 'debug';
    const debug = dbg('app:ui:components:PasteDialog');

</script>


<dialog class="modal" open>
	<div class="modal-box">



    </div>

	<button
		class="modal-backdrop"
		onclick={() => {
			debug('asd');
			A.mediaEditing = undefined;
		}}>close</button>
</dialog>

