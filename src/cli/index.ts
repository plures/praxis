#!/usr/bin/env node

/**
 * Praxis CLI
 * 
 * Command-line interface for the Praxis framework.
 */

import { Command } from 'commander';
import { generate } from './commands/generate.js';

const program = new Command();

program
  .name('praxis')
  .description('Praxis Framework - Full-stack application development')
  .version('0.1.0');

// Authentication command
program
  .command('login')
  .description('Authenticate with GitHub for Praxis Cloud access')
  .option('--token <token>', 'Use a personal access token instead of device flow')
  .action(async (options) => {
    try {
      const { loginCommand } = await import('./commands/auth.js');
      await loginCommand(options);
    } catch (error) {
      console.error('Error during login:', error);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Log out from Praxis Cloud')
  .action(async () => {
    try {
      const { logoutCommand } = await import('./commands/auth.js');
      await logoutCommand();
    } catch (error) {
      console.error('Error during logout:', error);
      process.exit(1);
    }
  });

program
  .command('whoami')
  .description('Show current authenticated user')
  .action(async () => {
    try {
      const { whoamiCommand } = await import('./commands/auth.js');
      await whoamiCommand();
    } catch (error) {
      console.error('Error checking authentication:', error);
      process.exit(1);
    }
  });

// Create commands
program
  .command('create <type> [name]')
  .description('Create a new Praxis project or component')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .option('-d, --directory <dir>', 'Output directory')
  .option('--features <features...>', 'Features to include')
  .action(async (type, name, options) => {
    try {
      const { create } = await import('./commands/create.js');
      await create(type, name, options);
    } catch (error) {
      console.error('Error creating:', error);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate code from schemas')
  .option('-s, --schema <file>', 'Schema file path')
  .option('-t, --target <target>', 'Generation target (all, logic, components, pluresdb)', 'all')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .option('-w, --watch', 'Watch for changes')
  .option('--auto-index <strategy>', 'Auto-indexing strategy for PluresDB (all, explicit, none)', 'all')
  .action(async (options) => {
    await generate(options);
  });

program
  .command('canvas [schema]')
  .description('Open CodeCanvas for visual editing')
  .option('-p, --port <port>', 'Port for Canvas server', '3000')
  .option('-m, --mode <mode>', 'Mode (edit, view, present)', 'edit')
  .action((schema, options) => {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   CodeCanvas Visual Editor                        ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`Schema: ${schema || '(new schema)'}`);
    console.log(`Port: ${options.port}`);
    console.log(`Mode: ${options.mode}\n`);
    console.log('⚠  CodeCanvas integration is coming soon!\n');
    console.log('For now, you can:');
    console.log('  • Edit schemas directly in your IDE');
    console.log('  • Use "praxis generate" to generate code from schemas');
    console.log('  • Check https://github.com/plures/praxis for updates\n');
  });

program
  .command('orchestrate')
  .description('Manage orchestration and distributed coordination')
  .option('-c, --config <file>', 'Orchestration configuration file')
  .option('-n, --nodes <count>', 'Number of nodes', '1')
  .action((options) => {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   Praxis Orchestration                            ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`Config: ${options.config || '(default)'}`);
    console.log(`Nodes: ${options.nodes}\n`);
    console.log('⚠  Orchestration features are coming soon!\n');
    console.log('For distributed system coordination:');
    console.log('  • Define orchestration in your schema');
    console.log('  • Configure DSC nodes for state synchronization');
    console.log('  • Check docs/guides/orchestration.md for patterns\n');
  });

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '5173')
  .action((options) => {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   Praxis Development Server                       ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`Port: ${options.port}\n`);
    console.log('To start the development server, run:\n');
    console.log('  npm run dev\n');
    console.log('This uses Vite under the hood for fast HMR.\n');
  });

program
  .command('build')
  .description('Build application for production')
  .option('-o, --output <dir>', 'Output directory', './dist')
  .option('--target <target>', 'Build target (web, desktop, mobile)', 'web')
  .action((options) => {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   Praxis Production Build                         ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log(`Output: ${options.output}`);
    console.log(`Target: ${options.target}\n`);
    console.log('To build for production, run:\n');
    console.log('  npm run build\n');
    console.log('This will:');
    console.log('  • Compile TypeScript');
    console.log('  • Bundle with Vite');
    console.log('  • Optimize assets');
    console.log(`  • Output to ${options.output}/\n`);
  });

// Cloud commands
const cloudCmd = program
  .command('cloud')
  .description('Manage Praxis Cloud connection and synchronization');

cloudCmd
  .command('init')
  .description('Connect to Praxis Cloud (setup wizard)')
  .option('-e, --endpoint <url>', 'Azure Function App endpoint URL')
  .option('-a, --app-id <id>', 'Application identifier')
  .option('--auto-sync', 'Enable automatic synchronization', false)
  .option('--interval <ms>', 'Sync interval in milliseconds', '5000')
  .action(async (options) => {
    try {
      // Dynamic import to avoid loading cloud module unless needed
      const { cloudInit } = await import('./commands/cloud.js');
      await cloudInit(options);
    } catch (error) {
      console.error('Error initializing cloud connection:', error);
      process.exit(1);
    }
  });

cloudCmd
  .command('status')
  .description('Check Praxis Cloud connection status')
  .action(async () => {
    try {
      const { cloudStatus } = await import('./commands/cloud.js');
      await cloudStatus();
    } catch (error) {
      console.error('Error checking cloud status:', error);
      process.exit(1);
    }
  });

cloudCmd
  .command('sync')
  .description('Manually trigger cloud synchronization')
  .action(async () => {
    try {
      const { cloudSync } = await import('./commands/cloud.js');
      await cloudSync();
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      process.exit(1);
    }
  });

cloudCmd
  .command('usage')
  .description('View cloud usage metrics')
  .action(async () => {
    try {
      const { cloudUsage } = await import('./commands/cloud.js');
      await cloudUsage();
    } catch (error) {
      console.error('Error retrieving usage metrics:', error);
      process.exit(1);
    }
  });

program.parse();
