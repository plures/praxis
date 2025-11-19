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
  .action((type, name, options) => {
    console.log(`Creating ${type}: ${name || 'unnamed'}`);
    console.log('Options:', options);
    console.log('Note: Full implementation coming soon');
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
    console.log(`Opening Canvas for: ${schema || 'new schema'}`);
    console.log('Options:', options);
    console.log('Note: Full implementation coming soon');
  });

program
  .command('orchestrate')
  .description('Manage orchestration and distributed coordination')
  .option('-c, --config <file>', 'Orchestration configuration file')
  .option('-n, --nodes <count>', 'Number of nodes', '1')
  .action((options) => {
    console.log('Starting orchestration...');
    console.log('Options:', options);
    console.log('Note: Full implementation coming soon');
  });

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '5173')
  .action((options) => {
    console.log('Starting development server...');
    console.log('Options:', options);
    console.log('Note: Full implementation coming soon');
  });

program
  .command('build')
  .description('Build application for production')
  .option('-o, --output <dir>', 'Output directory', './dist')
  .option('--target <target>', 'Build target (web, desktop, mobile)', 'web')
  .action((options) => {
    console.log('Building application...');
    console.log('Options:', options);
    console.log('Note: Full implementation coming soon');
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
