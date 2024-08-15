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

<dialog bind:this={$loginModal} id="loginModal" class="h-fit w-fit">
	<!-- <div class="modal-box"> -->
		<Login loginData={data} loginForm={form} />

		<!-- <p class="py-4">Press ESC key or click the button below to close</p> -->
		<!-- <div class="modal-action">
			<form method="dialog">
				<button class="btn">Close</button>
			</form>
		</div> -->
	<!-- </div> -->
</dialog>
