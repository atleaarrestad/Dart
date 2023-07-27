import { readFileSync } from 'fs';
import { defineConfig } from 'vite';


const packageJson = JSON.parse(readFileSync('./package.json', { encoding: 'utf8' }));


export default defineConfig({
	base:  '/Dart',
	define: {
		APP_VERSION: JSON.stringify(packageJson.version),
	},
	build: {
		outDir:      '../desktop/dist',
		emptyOutDir: true,
		minify: false,
		rollupOptions: {
			output: {
				manualChunks: {}
			},
		},
	},
});
