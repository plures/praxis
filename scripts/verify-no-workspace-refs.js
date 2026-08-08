#!/usr/bin/env node

/**
 * Pre-pack validation: ensures no workspace:* protocol references remain
 * in the package.json that will be published to npm.
 *
 * pnpm normally resolves workspace: references during `pnpm publish`, but
 * if `npm publish` is used directly (or resolution fails silently), the
 * unresolved workspace: protocol ends up on the registry, breaking all
 * external consumers with EUNSUPPORTEDPROTOCOL.
 *
 * This script is invoked via the "prepack" lifecycle hook so it runs
 * regardless of which tool triggers the publish.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkgPath = join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const depSections = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

const violations = [];

for (const section of depSections) {
  const deps = pkg[section];
  if (!deps) continue;
  for (const [name, version] of Object.entries(deps)) {
    if (typeof version === 'string' && version.startsWith('workspace:')) {
      violations.push(`  ${section} > ${name}: "${version}"`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\n❌ ERROR: package.json contains unresolved workspace: protocol references.\n` +
    `These cannot be installed by external consumers.\n\n` +
    violations.join('\n') +
    `\n\nUse 'pnpm publish' (which resolves workspace: automatically) or ` +
    `manually replace these with real version ranges before publishing.\n`
  );
  process.exit(1);
}

console.log('✓ No workspace: protocol references found in package.json');
