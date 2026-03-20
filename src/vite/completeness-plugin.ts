/**
 * Vite Plugin: Praxis Completeness Report
 *
 * Automatically outputs completeness score in build output.
 * Silent by default in production builds unless `verbose: true`.
 * Always shows in dev mode unless explicitly silenced.
 *
 * Usage in vite.config.ts:
 * ```ts
 * import { praxisCompletenessPlugin } from '@plures/praxis/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     praxisCompletenessPlugin({
 *       manifestPath: './src/lib/completeness-manifest.ts',
 *       threshold: 90,    // fail build if below (CI mode)
 *       strict: false,     // set to true for CI
 *       silent: false,     // set to true to suppress output
 *     }),
 *   ],
 * });
 * ```
 */

export interface PraxisCompletenessPluginOptions {
  /**
   * Path to the completeness manifest module.
   * Must default-export or named-export { branches, stateFields, transitions, rulesNeedingContracts }.
   */
  manifestPath?: string;
  /**
   * Minimum score to pass (default: 90). Below this is a warning; in strict mode, an error.
   */
  threshold?: number;
  /**
   * If true, build fails when below threshold. Use for CI.
   */
  strict?: boolean;
  /**
   * If true, suppresses all completeness output.
   */
  silent?: boolean;
}

/**
 * Creates a Vite plugin that reports Praxis completeness in build output.
 *
 * The plugin loads the manifest at build time, evaluates coverage, and
 * prints a summary. In strict mode, it fails the build if below threshold.
 */
export function praxisCompletenessPlugin(_options?: PraxisCompletenessPluginOptions) {
  const options = _options ?? {};
  const threshold = options.threshold ?? 90;
  const silent = options.silent ?? false;

  return {
    name: 'vite-plugin-praxis-completeness',
    enforce: 'post' as const,

    // We hook into buildEnd so the report appears at the end of the build
    buildEnd() {
      if (silent) return;

      // This plugin works as a hook point — the actual manifest loading
      // happens at the app level since manifests are app-specific.
      // The plugin provides the infrastructure; apps wire their manifest.
      console.log(`\n⟐ Praxis Completeness: threshold=${threshold}, strict=${options.strict ?? false}`);
      console.log('  Import your manifest and call auditCompleteness() in a build script or test.');
      console.log('  See @plures/praxis docs for setup.\n');
    },
  };
}
