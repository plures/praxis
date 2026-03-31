/**
 * Smoke tests for praxis-cli commands
 *
 * These tests verify that command modules can be imported and that
 * their exported functions exist, without executing full CLI logic.
 */

import { describe, it, expect } from 'vitest';

describe('praxis-cli command modules', () => {
  it('exports generate command', async () => {
    const { generate } = await import('../commands/generate.js');
    expect(typeof generate).toBe('function');
  });

  it('exports create command', async () => {
    const { create } = await import('../commands/create.js');
    expect(typeof create).toBe('function');
  });

  it('exports validate command', async () => {
    const { validateCommand } = await import('../commands/validate.js');
    expect(typeof validateCommand).toBe('function');
  });

  it('exports cloud commands', async () => {
    const { cloudInit, cloudStatus, cloudSync, cloudUsage } = await import(
      '../commands/cloud.js'
    );
    expect(typeof cloudInit).toBe('function');
    expect(typeof cloudStatus).toBe('function');
    expect(typeof cloudSync).toBe('function');
    expect(typeof cloudUsage).toBe('function');
  });

  it('exports conversations commands', async () => {
    const { captureCommand, pushCommand, classifyCommand, emitCommand } = await import(
      '../commands/conversations.js'
    );
    expect(typeof captureCommand).toBe('function');
    expect(typeof pushCommand).toBe('function');
    expect(typeof classifyCommand).toBe('function');
    expect(typeof emitCommand).toBe('function');
  });

  it('exports hooks commands', async () => {
    const { hooksInstall, hooksUninstall, hooksInit, hooksRun, hooksStatus } = await import(
      '../commands/hooks.js'
    );
    expect(typeof hooksInstall).toBe('function');
    expect(typeof hooksUninstall).toBe('function');
    expect(typeof hooksInit).toBe('function');
    expect(typeof hooksRun).toBe('function');
    expect(typeof hooksStatus).toBe('function');
  });

  it('exports auth commands', async () => {
    const { loginCommand, logoutCommand, whoamiCommand, getAuthToken } = await import(
      '../commands/auth.js'
    );
    expect(typeof loginCommand).toBe('function');
    expect(typeof logoutCommand).toBe('function');
    expect(typeof whoamiCommand).toBe('function');
    expect(typeof getAuthToken).toBe('function');
  });

  it('exports reverse command', async () => {
    const { reverseCommand } = await import('../commands/reverse.js');
    expect(typeof reverseCommand).toBe('function');
  });

  it('exports verify command', async () => {
    const { verify } = await import('../commands/verify.js');
    expect(typeof verify).toBe('function');
  });

  it('exports docs command', async () => {
    const { docs } = await import('../commands/docs.js');
    expect(typeof docs).toBe('function');
  });
});
