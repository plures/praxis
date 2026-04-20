import { afterEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marketplaceWebhookEndpoint } from './endpoints.js';
import { parseMarketplaceWebhookEvent } from '../marketplace.js';

const fixturesDir = join(fileURLToPath(new URL('.', import.meta.url)), '__fixtures__');

const webhookSecret = 'test-marketplace-secret';

const makeSignature = (payload: string) =>
  `sha256=${createHmac('sha256', webhookSecret).update(payload, 'utf8').digest('hex')}`;

const readFixture = (name: string) => {
  const raw = readFileSync(join(fixturesDir, name), 'utf8');
  return { raw, json: JSON.parse(raw) as unknown };
};

const createContext = () => ({
  log: (_message: string) => undefined,
  done: (_err?: Error, _result?: unknown) => undefined,
});

describe('Marketplace webhook schemas', () => {
  it('parses purchased, changed, and cancelled payload fixtures', () => {
    const purchased = readFixture('marketplace-purchased.json');
    const changed = readFixture('marketplace-changed.json');
    const cancelled = readFixture('marketplace-cancelled.json');

    expect(parseMarketplaceWebhookEvent(purchased.json)?.action).toBe('purchased');
    expect(parseMarketplaceWebhookEvent(changed.json)?.action).toBe('changed');
    expect(parseMarketplaceWebhookEvent(cancelled.json)?.action).toBe('cancelled');
  });
});

describe('marketplaceWebhookEndpoint', () => {
  const previousSecret = process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET;
      return;
    }

    process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET = previousSecret;
  });

  it('rejects webhook payload with invalid signature', async () => {
    process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET = webhookSecret;
    const payload = readFixture('marketplace-purchased.json');
    const response = await marketplaceWebhookEndpoint(createContext(), {
      method: 'POST',
      url: '/api/marketplace/webhook',
      headers: { 'x-hub-signature-256': 'sha256=invalid' },
      query: {},
      body: payload.json,
      rawBody: payload.raw,
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid webhook signature' });
  });

  it('updates tenant subscription state across purchased, changed, and cancelled events', async () => {
    process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET = webhookSecret;
    const purchased = readFixture('marketplace-purchased.json');
    const changed = readFixture('marketplace-changed.json');
    const cancelled = readFixture('marketplace-cancelled.json');

    const purchasedResponse = await marketplaceWebhookEndpoint(createContext(), {
      method: 'POST',
      url: '/api/marketplace/webhook',
      headers: { 'x-hub-signature-256': makeSignature(purchased.raw) },
      query: {},
      body: purchased.json,
      rawBody: purchased.raw,
    });

    expect(purchasedResponse.status).toBe(200);
    expect(purchasedResponse.body).toMatchObject({
      success: true,
      action: 'purchased',
      tenantId: 'github-12345',
      subscription: {
        tier: 'team',
        status: 'active',
        provider: 'marketplace',
        marketplacePlanId: 9001,
      },
    });

    const changedResponse = await marketplaceWebhookEndpoint(createContext(), {
      method: 'POST',
      url: '/api/marketplace/webhook',
      headers: { 'x-hub-signature-256': makeSignature(changed.raw) },
      query: {},
      body: changed.json,
      rawBody: changed.raw,
    });

    expect(changedResponse.status).toBe(200);
    expect(changedResponse.body).toMatchObject({
      success: true,
      action: 'changed',
      tenantId: 'github-12345',
      subscription: {
        tier: 'enterprise',
        status: 'active',
        provider: 'marketplace',
        marketplacePlanId: 9002,
      },
    });

    const cancelledResponse = await marketplaceWebhookEndpoint(createContext(), {
      method: 'POST',
      url: '/api/marketplace/webhook',
      headers: { 'x-hub-signature-256': makeSignature(cancelled.raw) },
      query: {},
      body: cancelled.json,
      rawBody: cancelled.raw,
    });

    expect(cancelledResponse.status).toBe(200);
    expect(cancelledResponse.body).toMatchObject({
      success: true,
      action: 'cancelled',
      tenantId: 'github-12345',
      subscription: {
        tier: 'enterprise',
        status: 'cancelled',
        provider: 'marketplace',
        marketplacePlanId: 9002,
      },
    });
  });
});
