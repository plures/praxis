// @ts-check
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.test.ts',
      'src/__tests__/**',
      'src/__benchmarks__/**',
      'test/**',
      'tests/**',
      'csharp/**',
      'examples/**',
      'templates/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'core/**/*.ts', 'ui/**/*.ts', 'tools/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // Type safety: forbid explicit `any` — the primary goal of this config
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['ui/**/*.svelte'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      svelte: sveltePlugin,
    },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Type safety: forbid explicit `any` in Svelte components too
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
