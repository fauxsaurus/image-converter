import {defineConfig} from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
	plugins: [solidPlugin()],
	server: {
		/** @ts-ignore following [this tutoria](https://dev.to/lexlohr/deploy-a-solid-start-app-on-github-pages-2l2l) */
		baseURL: process.env.BASE_PATH,
		preset: 'static',
		port: 3000,
		/** @note WSL-specific */
		watch: {usePolling: true},
	},
	build: {
		target: 'esnext',
	},
})
