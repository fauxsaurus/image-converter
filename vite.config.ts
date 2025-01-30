import {defineConfig} from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
	/** @ts-ignore process exists because this file is executed in node. */
	base: process.env.BASE_PATH,
	plugins: [solidPlugin()],
	server: {
		port: 3000,
		/** @note WSL-specific */
		watch: {usePolling: true},
	},
	build: {
		target: 'esnext',
	},
})
