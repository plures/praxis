import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const nativeDir = resolve(__dirname, '../../../crates/praxis-native');

// Determine whether the compiled NAPI binary is available.
// The binary is only present after `cargo build` (or `napi build`) has run for
// the crates/praxis-native crate — it is never present in a plain Node CI job
// that does not compile Rust.  `@plures/praxis-native` is a pnpm workspace
// package so `require.resolve` always succeeds; instead we check for the
// actual compiled .node files or attempt to fully load the module.
// When unavailable, the describe block is skipped rather than failing with
// "Cannot find module".
const nativeAvailable = (() => {
  const nodeFiles = [
    'praxis-native.linux-x64-gnu.node',
    'praxis-native.linux-x64-musl.node',
    'praxis-native.linux-arm64-gnu.node',
    'praxis-native.linux-arm64-musl.node',
    'praxis-native.darwin-x64.node',
    'praxis-native.darwin-arm64.node',
    'praxis-native.win32-x64-msvc.node',
  ];
  if (nodeFiles.some((f) => existsSync(join(nativeDir, f)))) return true;
  try {
    require('@plures/praxis-native');
    return true;
  } catch {
    return false;
  }
})();

const PX_FIXTURE = readFileSync(
  resolve(nativeDir, 'examples/wind-chess-v2.px'),
  'utf8'
);

describe.skipIf(!nativeAvailable)('@plures/praxis native addon integration', () => {
  it('loads the native NAPI binary at runtime', () => {
    const native = require('@plures/praxis-native');
    expect(native).toBeDefined();
    expect(typeof native.parse).toBe('function');
    expect(typeof native.compile).toBe('function');
    expect(typeof native.lint).toBe('function');
    expect(typeof native.execute).toBe('function');
    expect(typeof native.listNativeFunctions).toBe('function');
    expect(typeof native.compileWithLint).toBe('function');
  });

  it('listNativeFunctions returns valid JSON with function names', () => {
    const native = require('@plures/praxis-native');
    const result = JSON.parse(native.listNativeFunctions());
    expect(result).toHaveProperty('functions');
    expect(Array.isArray(result.functions)).toBe(true);
    expect(result.functions).toContain('sqrt');
    expect(result.functions).toContain('sin');
    expect(result.functions).toContain('cos');
  });

  it('parse() returns valid AST JSON for .px source', () => {
    const native = require('@plures/praxis-native');
    const ast = JSON.parse(native.parse(PX_FIXTURE));
    expect(ast).toBeDefined();
    expect(typeof ast).toBe('object');
  });

  it('compile() produces PluresDB records from .px source', () => {
    const native = require('@plures/praxis-native');
    const result = JSON.parse(native.compile(PX_FIXTURE));
    expect(result).toHaveProperty('records');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.records)).toBe(true);
  });

  it('lint() returns diagnostics array', () => {
    const native = require('@plures/praxis-native');
    const result = JSON.parse(native.lint(PX_FIXTURE));
    expect(result).toHaveProperty('diagnostics');
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it('compileWithLint() includes both records and diagnostics', () => {
    const native = require('@plures/praxis-native');
    const result = JSON.parse(native.compileWithLint(PX_FIXTURE));
    expect(result).toHaveProperty('records');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('diagnostics');
  });
});
