import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: 'dist',
  format: ['esm'],
  dts: false,
  clean: true,
  platform: 'node',
  banner: {
    js: '#!/usr/bin/env node',
  },
  noExternal: [],
});
