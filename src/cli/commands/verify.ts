/**
 * Verify Command
 *
 * Verifies the implementation of the project against the schema/rules.
 */

import { verifyImplementation } from '../../../ui/canvas-inspector/src/verify-fsm-implementation.js';

/** Options for the `verify` CLI command. */
export interface VerifyOptions {
  /** Show detailed output for each verification step */
  detailed?: boolean;
}

/**
 * Run a named verification pass against the project.
 *
 * Currently supports `"implementation"` to verify that all FSM states have
 * handler implementations. Exits with code 1 if verification fails.
 *
 * @param type - The verification type to run (e.g. `"implementation"`)
 * @param _options - Verification options
 */
export async function verify(type: string, _options: VerifyOptions): Promise<void> {
  if (type !== 'implementation') {
    console.error(`Unknown verification type: ${type}`);
    console.log('Supported types: implementation');
    process.exit(1);
  }

  console.log('Verifying FSM implementation...');

  try {
    const result = verifyImplementation();

    const missingCount = result.missingHandlers.length;
    const emptyCount = result.emptyHandlers.length;

    if (missingCount === 0 && emptyCount === 0) {
      console.log('✅ Verification passed! All rules have implementations.');
    } else {
      console.log('⚠️  Verification found issues:');

      if (missingCount > 0) {
        console.log(`\n  Missing Handlers (${missingCount}):`);
        result.missingHandlers.forEach((h: string) => console.log(`    - ${h}`));
      }

      if (emptyCount > 0) {
        console.log(`\n  Empty Handlers (${emptyCount}):`);
        result.emptyHandlers.forEach((h: string) => console.log(`    - ${h}`));
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}
