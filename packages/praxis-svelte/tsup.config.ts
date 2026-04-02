import { defineConfig } from 'tsup';
import { default as sveltePlugin } from 'esbuild-svelte';

export default defineConfig([
  // Node.js Build (Server-side Svelte compilation)
  {
    name: 'node',
    entry: {
      index: 'src/index.ts',
      'components/index': 'src/components/index.ts',
    },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    platform: 'node',
    esbuildPlugins: [
      sveltePlugin({
        compilerOptions: {
          runes: true,
          generate: 'server',
        },
        include: /\.(svelte\.ts|svelte\.js)$/,
      }),
    ],
    esbuildOptions(options) {
      options.resolveExtensions = ['.ts', '.js', '.svelte.ts', '.svelte.js', '.json'];
    },
  },
]);
