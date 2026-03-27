import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'logic/index': 'src/logic/index.ts',
    'decision-ledger/index': 'src/decision-ledger/index.ts',
    'schema-engine/index': 'src/schema-engine/index.ts',
    'dsl/index': 'src/dsl/index.ts',
  },
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  platform: 'node',
});
