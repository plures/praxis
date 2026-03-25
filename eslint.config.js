// @ts-check
import tseslint from 'typescript-eslint';

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
);
