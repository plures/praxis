import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const root = resolve(__dirname, '../..');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@plures/praxis/cloud': resolve(root, 'src/cloud/index.ts'),
      '@plures/praxis/hooks': resolve(root, 'src/hooks/index.ts'),
      '@plures/praxis/mcp': resolve(root, 'src/mcp/index.ts'),
      '@plures/praxis/component': resolve(root, 'src/core/component/generator.ts'),
      '@plures/praxis': resolve(root, 'src/index.ts'),
      '@plures/praxis-core/decision-ledger': resolve(
        root,
        'packages/praxis-core/src/decision-ledger/index.ts'
      ),
      '@plures/praxis-core/schema-engine': resolve(
        root,
        'packages/praxis-core/src/schema-engine/index.ts'
      ),
      '@plures/praxis-core': resolve(root, 'packages/praxis-core/src/index.ts'),
    },
  },
});
