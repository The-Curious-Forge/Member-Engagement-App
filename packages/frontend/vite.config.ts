import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5174,
		host: true,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://backend:3000',
				changeOrigin: true,
				secure: false,
				// Keep request path when proxying
				rewrite: (path) => path,
				// Log proxy activity for debugging
				configure: (proxy) => {
					proxy.on('error', (err) => {
						console.error('Proxy error:', err);
					});
					proxy.on('proxyReq', (proxyReq, req) => {
						console.log('Proxying request:', req.method, req.url, '→', proxyReq.path);
					});
					proxy.on('proxyRes', (proxyRes, req) => {
						console.log('Received response:', proxyRes.statusCode, req.url);
					});
				}
			},
			'/socket.io': {
				target: 'http://backend:3000',
				ws: true
			}
		}
	},
	preview: {
		port: 4173,
		strictPort: true,
		host: '0.0.0.0',
		allowedHosts: [
			'signin.thecuriousforge.org',
			'.thecuriousforge.org',
			'localhost',
			'127.0.0.1'
		],
	}
});
