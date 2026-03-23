import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg'],
			manifest: {
				id: '/',
				name: 'TJPubls',
				short_name: 'TJPubls',
				description: 'Gestión de publicadores y reportes',
				theme_color: '#000000',
				background_color: '#1D68DF',
				display_override: ['standalone', 'browser'],
				display: 'standalone',
				start_url: '/',
				scope: '/',
				lang: 'es',
				prefer_related_applications: false,
				icons: [
					{
						src: '/pwa-192x192.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any maskable',
					},
					{
						src: '/pwa-512x512.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https?:\/\/.*\/api\/v1\/.*$/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							networkTimeoutSeconds: 6,
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	},
	server: {
		port: 5173,
		host: true
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true
	}
})
