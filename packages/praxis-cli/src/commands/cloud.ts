/**
 * Cloud CLI Commands
 *
 * CLI commands for Praxis Cloud connectivity.
 */

import * as fs from 'fs';
import * as path from 'path';
import { authenticateWithDeviceFlow } from '@plures/praxis/cloud';
import { connectRelay } from '@plures/praxis/cloud';
import type { CloudRelayConfig } from '@plures/praxis/cloud';

const CONFIG_FILE = '.praxis-cloud.json';
const GITHUB_CLIENT_ID = 'Ov23liQxF7P0BqUxVXHk'; // Demo client ID (replace in production)

interface StoredConfig {
  endpoint: string;
  appId: string;
  authToken?: string;
  autoSync?: boolean;
  syncInterval?: number;
}

/**
 * Load stored cloud configuration
 */
function loadConfig(): StoredConfig | null {
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load cloud configuration:', error);
  }
  return null;
}

/**
 * Save cloud configuration
 */
function saveConfig(config: StoredConfig): void {
  try {
    const configPath = path.join(process.cwd(), CONFIG_FILE);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\n✓ Configuration saved to ${CONFIG_FILE}`);
  } catch (error) {
    console.error('Failed to save cloud configuration:', error);
    throw error;
  }
}

/**
 * Initialize cloud connection (wizard)
 */
export async function cloudInit(options: {
  endpoint?: string;
  appId?: string;
  autoSync?: boolean;
  interval?: string;
}): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Welcome to Praxis Cloud Setup Wizard           ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Check if already configured
  const existingConfig = loadConfig();
  if (existingConfig) {
    console.log('⚠  Existing cloud configuration found.');
    console.log(`   Endpoint: ${existingConfig.endpoint}`);
    console.log(`   App ID: ${existingConfig.appId}\n`);
    // In production, prompt user to confirm overwrite
  }

  // Get endpoint
  let endpoint = options.endpoint;
  if (!endpoint) {
    // In production, prompt user for input
    endpoint = 'https://praxis-relay.azurewebsites.net';
    console.log(`Using default endpoint: ${endpoint}`);
  }

  // Get app ID
  let appId = options.appId;
  if (!appId) {
    // In production, prompt user for input or generate from git remote
    appId = path.basename(process.cwd());
    console.log(`Using app ID from directory name: ${appId}`);
  }

  // Authenticate with GitHub
  console.log('\n🔐 Authenticating with GitHub...');
  const authResult = await authenticateWithDeviceFlow(GITHUB_CLIENT_ID);

  if (!authResult.success || !authResult.token) {
    console.error('\n✗ Authentication failed');
    process.exit(1);
  }

  console.log(`✓ Authenticated as ${authResult.user?.login || 'unknown'}`);

  // Test connection
  console.log('\n🔗 Testing connection to Praxis Cloud...');

  try {
    const config: CloudRelayConfig = {
      endpoint,
      appId,
      authToken: authResult.token,
      autoSync: options.autoSync,
      syncInterval: options.interval ? parseInt(options.interval) : 5000,
    };

    const client = await connectRelay(endpoint, config);
    const health = await client.getHealth();

    if (health.status === 'healthy') {
      console.log('✓ Connected successfully!');
      console.log(`  Status: ${health.status}`);
      console.log(`  Version: ${health.version}`);
    } else {
      console.log(`⚠  Connected but service is ${health.status}`);
    }

    await client.disconnect();

    // Save configuration
    const storedConfig: StoredConfig = {
      endpoint,
      appId,
      authToken: authResult.token,
      autoSync: options.autoSync,
      syncInterval: config.syncInterval,
    };

    saveConfig(storedConfig);

    console.log('\n✓ Praxis Cloud is now configured!');
    console.log('\nNext steps:');
    console.log("  • Use 'praxis cloud status' to check connection");
    console.log("  • Use 'praxis cloud sync' to manually sync");
    console.log("  • Use 'praxis cloud usage' to view metrics");
    console.log('\nIn your code:');
    console.log('  import { connectRelay } from "@plures/praxis/cloud";');
    console.log(`  const relay = await connectRelay("${endpoint}", {`);
    console.log(`    appId: "${appId}",`);
    console.log(`    authToken: "<your-token>"`);
    console.log('  });\n');
  } catch (error) {
    console.error('\n✗ Failed to connect to Praxis Cloud');
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Check cloud connection status
 *
 * @returns A promise that resolves after the cloud connection status is printed
 */
export async function cloudStatus(): Promise<void> {
  const config = loadConfig();

  if (!config) {
    console.log('\n✗ No cloud configuration found');
    console.log("  Run 'praxis cloud init' to set up cloud connection\n");
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Praxis Cloud Status                             ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`App ID: ${config.appId}`);
  console.log(`Auto Sync: ${config.autoSync ? 'enabled' : 'disabled'}`);

  if (config.autoSync) {
    console.log(`Sync Interval: ${config.syncInterval}ms`);
  }

  try {
    const client = await connectRelay(config.endpoint, config);
    const health = await client.getHealth();

    console.log(`\nConnection: ✓ Connected`);
    console.log(`Status: ${health.status}`);
    console.log(`Version: ${health.version}`);
    console.log('\nServices:');
    console.log(`  Relay: ${health.services.relay ? '✓' : '✗'}`);
    console.log(`  Event Grid: ${health.services.eventGrid ? '✓' : '✗'}`);
    console.log(`  Storage: ${health.services.storage ? '✓' : '✗'}`);
    console.log(`  Auth: ${health.services.auth ? '✓' : '✗'}`);

    await client.disconnect();
  } catch (error) {
    console.log(`\nConnection: ✗ Failed`);
    console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log();
}

/**
 * Manually trigger cloud sync
 *
 * @returns A promise that resolves when the sync operation completes
 */
export async function cloudSync(): Promise<void> {
  const config = loadConfig();

  if (!config) {
    console.log('\n✗ No cloud configuration found');
    console.log("  Run 'praxis cloud init' to set up cloud connection\n");
    process.exit(1);
  }

  console.log('\n🔄 Syncing to Praxis Cloud...');

  try {
    const client = await connectRelay(config.endpoint, config);

    // In production, collect actual facts and events to sync
    await client.sync({
      type: 'delta',
      appId: config.appId,
      clock: {},
      facts: [],
      events: [],
      timestamp: Date.now(),
    });

    console.log('✓ Sync completed successfully\n');

    await client.disconnect();
  } catch (error) {
    console.error('\n✗ Sync failed');
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

/**
 * View cloud usage metrics
 *
 * @returns A promise that resolves after the usage metrics are printed
 */
export async function cloudUsage(): Promise<void> {
  const config = loadConfig();

  if (!config) {
    console.log('\n✗ No cloud configuration found');
    console.log("  Run 'praxis cloud init' to set up cloud connection\n");
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Praxis Cloud Usage Metrics                      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  try {
    const client = await connectRelay(config.endpoint, config);
    const usage = await client.getUsage();

    console.log(`App ID: ${usage.appId}`);
    console.log(`\nMetrics:`);
    console.log(`  Total Syncs: ${usage.syncCount}`);
    console.log(`  Events Forwarded: ${usage.eventCount}`);
    console.log(`  Facts Synced: ${usage.factCount}`);
    console.log(`  Storage Used: ${(usage.storageBytes / 1024).toFixed(2)} KB`);

    const periodDuration = usage.periodEnd - usage.periodStart;
    const durationHours = (periodDuration / 1000 / 60 / 60).toFixed(1);
    console.log(`\nPeriod: ${durationHours} hours`);
    console.log(`  From: ${new Date(usage.periodStart).toLocaleString()}`);
    console.log(`  To: ${new Date(usage.periodEnd).toLocaleString()}`);

    console.log();

    await client.disconnect();
  } catch (error) {
    console.error('\n✗ Failed to retrieve usage metrics');
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
