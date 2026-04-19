import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { exports: Record<string, unknown> };

describe('@plures/praxis compatibility exports', () => {
  it('keeps legacy subpath exports in package.json', () => {
    expect(pkg.exports).toHaveProperty('.');
    expect(pkg.exports).toHaveProperty('./core');
    expect(pkg.exports).toHaveProperty('./svelte');
    expect(pkg.exports).toHaveProperty('./cli');
    expect(pkg.exports).toHaveProperty('./cloud');
    expect(pkg.exports).toHaveProperty('./unified');
  });

  it('resolves legacy import paths to built artifacts', () => {
    const legacySubpaths = ['core', 'svelte', 'cli', 'cloud', 'unified'];

    for (const subpath of legacySubpaths) {
      const resolved = require.resolve(`@plures/praxis/${subpath}`).replaceAll('\\', '/');
      expect(resolved).toContain('/packages/praxis/dist/');
    }
  });

  it('loads unified compatibility exports', async () => {
    const unified = await import('@plures/praxis/unified');
    expect(unified).toHaveProperty('createApp');
    expect(unified).toHaveProperty('definePath');
    expect(unified).toHaveProperty('defineRule');
  });
});

