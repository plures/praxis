import { defineConfig } from 'tsup';
import { default as sveltePlugin } from 'esbuild-svelte';

// Workspace-only packages that are NOT published to npm (praxis-core, praxis-cloud
// are internal). They MUST be inlined into @plures/praxis's dist so the published
// package is self-contained; otherwise external consumers hit
// `Unsupported URL Type "workspace:"` / 404 on install. praxis-core has zero
// runtime deps and praxis-cloud only depends on praxis-core, so bundling is clean.
// See memory/qa-fix-milestones.md (2026-07-03) for the full root-cause analysis.
const BUNDLE_WORKSPACE_PKGS = [/^@plures\/praxis-core$/, /^@plures\/praxis-cloud$/];

export default defineConfig([
  // Node.js Build (Server-side Svelte compilation)
  {
    name: 'node',
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/index.core.ts',
      schema: 'src/core/schema/types.ts',
      component: 'src/core/component/generator.ts',
      'cloud/index': 'packages/praxis-cloud/src/index.ts',
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
    noExternal: BUNDLE_WORKSPACE_PKGS,
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
    noExternal: BUNDLE_WORKSPACE_PKGS,
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
