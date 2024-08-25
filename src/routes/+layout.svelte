<script>
	import '../app.css';

	import { Login } from '$lib/components';
	import { loginModal } from '$lib/stores/loginModal';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { toIdMap } from '$lib/utils';
	import { dbUser, assistants, hiddenItems } from '$lib/stores/appstate';
	import { onMount } from 'svelte';

	$: {
		if ($mode === 'light') {
			import('highlight.js/styles/github.min.css');
		} else {
			import('highlight.js/styles/github-dark.min.css');
		}
	}

	import dbg from 'debug';
	const debug = dbg('app:ui:settings:layout');

	export let data;
	export let form;

	onMount(async () => {
		debug('onMount');
		$dbUser = data.dbUser;
		$assistants = toIdMap(data.assistants);
		$hiddenItems = data.hiddenItems;
		debug('onMount', { $dbUser });
	});
</script>

<ModeWatcher />

<slot />

<dialog bind:this={$loginModal} id="loginModal" class="modal modal-middle">
	<div class="modal-box h-fit w-fit">
		<Login {form} />
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
