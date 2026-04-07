import { defineConfig } from 'tsup';
import { default as sveltePlugin } from 'esbuild-svelte';

export default defineConfig([
  // Node.js Build (Server-side Svelte compilation)
  {
    name: 'node',
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/index.core.ts',
      schema: 'src/core/schema/types.ts',
      component: 'src/core/component/generator.ts',
      'cloud/index': 'src/cloud/index.ts',
      'hooks/index': 'src/hooks/index.ts',
      'lifecycle/index': 'src/lifecycle/index.ts',
      'cli/index': 'src/cli/index.ts',
      'unified/index': 'src/unified/index.ts',
    },
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
      'core/index': 'src/index.core.browser.ts',
      'expectations/index': 'src/expectations/index.ts',
      'factory/index': 'src/factory/index.ts',
      'project/index': 'src/project/index.ts',
      'unified/index': 'src/unified/index.ts',
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
