/**
 * @plures/praxis native addon bridge
 *
 * Runtime loads the @plures/praxis-native NAPI binary and exposes
 * typed wrappers for .px compile/parse/lint/execute operations.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load the native NAPI addon at runtime (CJS require for .node resolution)
const binding = require('@plures/praxis-native') as typeof import('@plures/praxis-native');

/** Parse .px source into AST (JSON string) */
export const parse: (source: string) => string = binding.parse;

/** Compile .px source into PluresDB records (JSON string) */
export const compile: (source: string) => string = binding.compile;

/** Lint .px source and return diagnostics (JSON string) */
export const lint: (source: string) => string = binding.lint;

/** Execute a compiled procedure with context (JSON string) */
export const execute: (compiledJson: string, contextJson: string) => string = binding.execute;

/** List native functions available in the runtime (JSON string) */
export const listNativeFunctions: () => string = binding.listNativeFunctions;

/** Compile .px source with lint diagnostics included (JSON string) */
export const compileWithLint: (source: string) => string = binding.compileWithLint;

// Re-export everything as the native namespace
export const native = {
  parse,
  compile,
  lint,
  execute,
  listNativeFunctions,
  compileWithLint,
} as const;

/** Whether the native addon loaded successfully */
export const nativeAvailable = true;
