<script>
	import '../app.css';

	import { ModeWatcher, mode, setTheme } from 'mode-watcher';
	import { toggleMode } from 'mode-watcher';
	import { Login } from '$lib/components';
	import { loginModal } from '$lib/stores/loginModal';

	export let data;
	export let form;

	function cycleTheme() {
		toggleMode();
		const theme = $mode === 'dark' ? 'dark' : 'light';
		setTheme(theme);
		document.documentElement.setAttribute('data-theme', theme);
	}
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
