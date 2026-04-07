import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@plures\/praxis$/, replacement: path.resolve(root, 'src/index.ts') },
      { find: /^@plures\/praxis\/schema$/, replacement: path.resolve(root, 'src/core/schema/types.ts') },
      { find: /^@plures\/praxis-core$/, replacement: path.resolve(root, 'packages/praxis-core/src/index.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
