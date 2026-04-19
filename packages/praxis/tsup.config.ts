import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core.ts',
    svelte: 'src/svelte.ts',
    cli: 'src/cli.ts',
    cloud: 'src/cloud.ts',
    unified: '../../src/unified/index.ts',
  },
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  platform: 'node',
});

