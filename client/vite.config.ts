import { readFileSync } from 'fs';
import { defineConfig } from 'vite';


const packageJson = JSON.parse(readFileSync('./package.json', { encoding: 'utf8' }));


export default defineConfig({
	base:   '/Dart/',
	define: {
		APP_VERSION: JSON.stringify(packageJson.version),
	},
	esbuild: {
		minifyIdentifiers: false,
	},
	build: {
		outDir:        '../desktop/dist',
		emptyOutDir:   true,
		minify:        false,
		rollupOptions: {
			preserveEntrySignatures: 'allow-extension',
			output:                  {
				preserveModules:     true,
				preserveModulesRoot: 'src',
				entryFileNames:      (entry) => `${ entry.name }.js`,
			},
		},

		sourcemap: true,

	},
});
