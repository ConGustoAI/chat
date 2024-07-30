// import { fontFamily } from 'tailwindcss/defaultTheme';
import daisyui from 'daisyui';
import { dark, light } from 'daisyui/src/theming/themes';

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	plugins: [daisyui],
	themes: ['light', 'dark'],
	daisyui: {
		themes: [
			{
				dark: {
					...dark,
					'--rounded-btn': '0',
					// '--rounded-box': '0'
				},
				light: {
					...light,
					'--rounded-btn': '0',
					'--rounded-box': '0'
				}
			}
		]
	}
};

export default config;
