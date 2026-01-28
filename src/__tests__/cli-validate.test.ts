/**
 * CLI Validate Command - Integration Tests
 * 
 * Tests for the praxis validate command with decision ledger features.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up from src/__tests__ to project root
const projectRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(projectRoot, 'dist/node/cli/index.js');
const sampleRegistryPath = path.join(projectRoot, 'examples/sample-registry.js');

describe('CLI Validate Command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(tmpdir(), `praxis-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should validate registry and output to console', async () => {
    const { stdout, stderr } = await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath}`
    );

    expect(stdout).toContain('Contract Validation Report');
    expect(stdout).toContain('Total: 5');
    expect(stdout).toContain('auth.login');
    expect(stderr).toContain('[Praxis][WARN]');
  });

  it('should output validation report as JSON', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath} --output json 2>/dev/null`
    );

    const report = JSON.parse(stdout);
    
    expect(report).toHaveProperty('complete');
    expect(report).toHaveProperty('incomplete');
    expect(report).toHaveProperty('missing');
    expect(report).toHaveProperty('total');
    expect(report.total).toBe(5);
  });

  it('should output validation report as SARIF', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath} --output sarif 2>/dev/null`
    );

    const sarif = JSON.parse(stdout);
    
    expect(sarif).toHaveProperty('version', '2.1.0');
    expect(sarif).toHaveProperty('runs');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].tool.driver.name).toBe('Praxis Decision Ledger');
  });

  it('should create logic ledger snapshots with --ledger option', async () => {
    const ledgerDir = path.join(tempDir, 'ledger');
    
    await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath} --ledger ${ledgerDir} --author "test-user" 2>&1`
    );

    // Check that ledger directory was created
    const ledgerPath = path.join(ledgerDir, 'logic-ledger');
    const exists = await fs.access(ledgerPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Check that index.json was created
    const indexPath = path.join(ledgerPath, 'index.json');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    expect(index).toHaveProperty('byRuleId');
    expect(index.byRuleId).toHaveProperty('auth.login');

    // Check that a versioned snapshot was created
    // The path in byRuleId is relative to ledgerDir, not ledgerPath
    const ruleDirRelative = index.byRuleId['auth.login'];
    const ruleDir = path.join(ledgerDir, ruleDirRelative);
    const latestPath = path.join(ruleDir, 'LATEST.json');
    const latestContent = await fs.readFile(latestPath, 'utf-8');
    const latest = JSON.parse(latestContent);
    expect(latest).toHaveProperty('ruleId', 'auth.login');
    expect(latest).toHaveProperty('version', 1);
    expect(latest).toHaveProperty('canonicalBehavior');
    expect(latest).toHaveProperty('assumptions');
    expect(latest).toHaveProperty('artifacts');
    expect(latest).toHaveProperty('drift');
  });

  it('should emit contract gaps as facts with --emit-facts option', async () => {
    const gapFile = path.join(tempDir, 'gaps.json');
    
    await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath} --emit-facts --gap-output ${gapFile}`
    );

    // Check that gap file was created
    const gapContent = await fs.readFile(gapFile, 'utf-8');
    const gaps = JSON.parse(gapContent);
    
    expect(gaps).toHaveProperty('facts');
    expect(gaps).toHaveProperty('events');
    expect(Array.isArray(gaps.facts)).toBe(true);
    expect(gaps.facts.length).toBeGreaterThan(0);
    
    // Check that facts have correct structure
    const firstFact = gaps.facts[0];
    expect(firstFact).toHaveProperty('tag', 'ContractMissing');
    expect(firstFact).toHaveProperty('payload');
    expect(firstFact.payload).toHaveProperty('ruleId');
    expect(firstFact.payload).toHaveProperty('missing');
    expect(firstFact.payload).toHaveProperty('severity');
  });

  it('should exit with error code in strict mode if contracts missing', async () => {
    try {
      await execAsync(
        `node ${cliPath} validate --registry ${sampleRegistryPath} --strict 2>&1`
      );
      // Should not reach here - strict mode should exit with error
      throw new Error('Expected command to fail in strict mode');
    } catch (error: any) {
      // Expect non-zero exit code
      expect(error.code).toBe(1);
      // Check that stderr contains error message
      const combinedOutput = error.stdout || error.stderr || '';
      expect(combinedOutput).toContain('Validation failed');
    }
  });

  it('should handle missing registry gracefully', async () => {
    const { stdout } = await execAsync(
      `node ${cliPath} validate --registry ./non-existent-registry.js`
    );

    expect(stdout).toContain('Contract Validation Report');
    expect(stdout).toContain('Total: 0');
    expect(stdout).toContain('All contracts validated successfully');
  });

  it('should track drift when updating contracts', async () => {
    const ledgerDir = path.join(tempDir, 'ledger');
    
    // First validation
    await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath} --ledger ${ledgerDir} --author "test-user" 2>&1`
    );

    // Second validation (simulates contract update)
    await execAsync(
      `node ${cliPath} validate --registry ${sampleRegistryPath} --ledger ${ledgerDir} --author "test-user" 2>&1`
    );

    // Check that version was incremented
    const indexPath = path.join(ledgerDir, 'logic-ledger', 'index.json');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    
    const ruleDirRelative = index.byRuleId['auth.login'];
    const ruleDir = path.join(ledgerDir, ruleDirRelative);
    const latestPath = path.join(ruleDir, 'LATEST.json');
    const latestContent = await fs.readFile(latestPath, 'utf-8');
    const latest = JSON.parse(latestContent);
    
    // Second run should have version 2
    expect(latest.version).toBe(2);
    
    // Check that v0001.json and v0002.json exist
    const v1Path = path.join(ruleDir, 'v0001.json');
    const v2Path = path.join(ruleDir, 'v0002.json');
    const v1Exists = await fs.access(v1Path).then(() => true).catch(() => false);
    const v2Exists = await fs.access(v2Path).then(() => true).catch(() => false);
    expect(v1Exists).toBe(true);
    expect(v2Exists).toBe(true);
  });
});
