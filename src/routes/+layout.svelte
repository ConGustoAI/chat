<script>
	import '../app.css';

	import { ModeWatcher, mode, setTheme } from 'mode-watcher';
	import { toggleMode } from 'mode-watcher';

	function cycleTheme() {
		toggleMode();
		const theme = $mode === 'dark' ? 'dark' : 'light';
		setTheme(theme);
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<ModeWatcher />
<!-- <button on:click={cycleTheme}>Toggle Mode</button> -->

<slot />
