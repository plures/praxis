import { defineConfig } from 'tsup';
import { default as sveltePlugin } from 'esbuild-svelte';

export default defineConfig([
  // Node.js Build (Server-side Svelte compilation)
  {
    name: 'node',
    entry: ['src/index.ts', 'src/integrations/svelte.ts'],
    outDir: 'dist/node',
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
  // Browser Build (Client-side Svelte compilation)
  {
    name: 'browser',
    entry: {
      index: 'src/index.browser.ts',
      'integrations/svelte': 'src/integrations/svelte.ts'
    },
    outDir: 'dist/browser',
    format: ['esm'],
    dts: true,
    clean: true,
    platform: 'browser',
    esbuildPlugins: [
      sveltePlugin({
        compilerOptions: {
          runes: true,
          generate: 'client',
        },
        include: /\.(svelte\.ts|svelte\.js)$/,
      }),
    ],
    esbuildOptions(options) {
      options.resolveExtensions = ['.ts', '.js', '.svelte.ts', '.svelte.js', '.json'];
    },
  },
]);
