// import { fontFamily } from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';
import daisyui from 'daisyui';
import { dark } from 'daisyui/src/theming/themes';
/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	plugins: [daisyui, typography],
	themes: ['dark', 'light'],
	theme: {
		extend: {
			colors: {
				'base-usermessage': 'var(--base-usermessage)',
				message: 'var(--message)',
				star: 'var(--star)'
			}
		}
	},
	daisyui: {
		themes: [
			{
				dark: {
					...dark,
					fontFamily:
						'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol',
					primary: '#212121',
					'base-100': '#212121', // Default background color
					'base-200': '#171717', // Default slightly darker background color

					info: '#8be9fd',
					success: '#50fa7b',
					warning: '#f1fa8c',
					error: '#ff5555',

					'--star': '#ffff00',
					'--base-usermessage': '#2f2f2f',
					'--message': '#ececec',

					'--rounded-btn': '0'
					// '--rounded-box': '0'
				},
				light: {
					fontFamily:
						'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol',
					primary: '#ffffff',
					'base-100': '#ffffff', // Default background color
					'base-200': '#f9f9f9', // Default slightly darker background color
					'base-300': '#f4f4f4', // Default slightly darker background color
					// 'base-content': '#212121',
					info: '#8be9fd',
					success: '#50fa7b',
					warning: '#f1fa8c',
					error: '#ff5555',

					'--star': '#444444',
					'--base-usermessage': '#f4f4f4',
					'--message': '#0d0d0d',

					'--rounded-btn': '1'
					// '--rounded-box': '0'
				}
			}
		]
	}
};

export default config;
