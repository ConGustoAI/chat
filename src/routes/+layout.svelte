<script>
	import '../app.css';

	import { Login } from '$lib/components';
	import { loginModal } from '$lib/stores/loginModal';
	import { ModeWatcher } from 'mode-watcher';
	import { toIdMap } from '$lib/utils';

	export let data;
	export let form;

	import { dbUser, assistants, hiddenItems } from '$lib/stores/appstate';
	import dbg from 'debug';
	import { onMount } from 'svelte';
	const debug = dbg('app:ui:settings:layout');

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
		<Login loginData={data} loginForm={form} />
	</div>

	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
