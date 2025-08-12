import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		adapter: adapter({
			// Output directory for the server build
			out: 'build',
			// Enable precompressed files for better performance
			precompress: true,
			// Environment variables prefix
			envPrefix: ''
		})
	},

	extensions: ['.svelte', '.svx']
};

export default config;
