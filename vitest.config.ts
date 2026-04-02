import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // More-specific subpaths must come before the bare package alias so they
      // are not swallowed by the '@plures/praxis-core' prefix match.
      { find: /^@plures\/praxis-core\/decision-ledger$/, replacement: path.resolve(__dirname, 'packages/praxis-core/src/decision-ledger/index.ts') },
      { find: /^@plures\/praxis-core\/logic$/, replacement: path.resolve(__dirname, 'packages/praxis-core/src/logic/index.ts') },
      { find: /^@plures\/praxis-core\/schema-engine$/, replacement: path.resolve(__dirname, 'packages/praxis-core/src/schema-engine/index.ts') },
      { find: /^@plures\/praxis-core\/dsl$/, replacement: path.resolve(__dirname, 'packages/praxis-core/src/dsl/index.ts') },
      { find: /^@plures\/praxis-core$/, replacement: path.resolve(__dirname, 'packages/praxis-core/src/index.ts') },
      // Subpath exports for @plures/praxis (must come before bare alias)
      { find: /^@plures\/praxis\/cloud$/, replacement: path.resolve(__dirname, 'src/cloud/index.ts') },
      { find: /^@plures\/praxis\/hooks$/, replacement: path.resolve(__dirname, 'src/hooks/index.ts') },
      { find: /^@plures\/praxis\/mcp$/, replacement: path.resolve(__dirname, 'src/mcp/index.ts') },
      { find: /^@plures\/praxis\/component$/, replacement: path.resolve(__dirname, 'src/core/component/generator.ts') },
      { find: /^@plures\/praxis$/, replacement: path.resolve(__dirname, 'src/index.ts') },
      { find: /^@plures\/praxis-svelte\/components$/, replacement: path.resolve(__dirname, 'packages/praxis-svelte/src/components/index.ts') },
      { find: /^@plures\/praxis-svelte$/, replacement: path.resolve(__dirname, 'packages/praxis-svelte/src/index.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/test/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.ts',
        'core/**/*.ts',
        'ui/**/*.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/__benchmarks__/**',
        '**/*.test.ts',
        '**/*.bench.ts',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/test/**',
        // Workspace packages have their own test suites
        'packages/**',
        'src/examples/**',
        'src/cli/**',
        'src/adapters/**',
        'src/index.ts',
        'src/index.browser.ts',
        'src/index.core.ts',
        'src/types.ts',
        'src/dsl.ts',
        'src/flows.ts',
        'src/step.ts',
        'src/registry.ts',
        // src/core/** are pure re-exports from @plures/praxis-core workspace package
        'src/core/actors.ts',
        'src/core/completeness.ts',
        'src/core/engine.ts',
        'src/core/introspection.ts',
        'src/core/protocol.ts',
        'src/core/reactive-engine.ts',
        'src/core/rule-result.ts',
        'src/core/rules.ts',
        'src/core/ui-rules.ts',
        'src/chronos/index.ts',
        'src/conversations/index.ts',
        'src/conversations/types.ts',
        'src/core/chronicle/index.ts',
        'src/chronos-bridge/**',
        'src/causal-anomaly/**',
        'src/uncertainty/**',
        'src/cloud/auth.ts',
        'src/cloud/index.ts',
        'src/cloud/marketplace.ts',
        'src/cloud/relay/**',
        'src/cloud/sponsors.ts',
        'src/cloud/types.ts',
        'src/hooks/context.ts',
        'src/hooks/install.ts',
        'src/integrations/unified.ts',
        'ui/svelte-generator/**',
        'ui/canvas-inspector/**',
        'core/codegen/index.ts',
        'core/db-adapter/**',
        'core/logic-engine/**',
        'core/schema-engine/index.ts',
        'core/schema-engine/types.ts',
      ],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 75,
        branches: 60,
      },
    },
  },
});
