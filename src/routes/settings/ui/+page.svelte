<script lang="ts">
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	import { mode, theme, setTheme } from 'mode-watcher';
	import { toggleMode } from 'mode-watcher';

	export function cycleTheme() {
		toggleMode();
		const theme = $mode === 'dark' ? 'dark' : 'light';
		setTheme(theme);
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<label class="flex cursor-pointer gap-2">
	<Sun />
	<input type="checkbox" checked={$theme === "dark"} on:click={cycleTheme} class="toggle theme-controller" />
	<Moon />
</label>
