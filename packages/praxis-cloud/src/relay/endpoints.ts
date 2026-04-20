/**
 * Azure Functions Relay Endpoints
 *
 * HTTP-triggered Azure Functions for Praxis Cloud Relay.
 */

import type { CRDTSyncMessage, UsageMetrics, HealthCheckResponse } from '../types.js';
import type { Subscription } from '../billing.js';
import { BillingProvider, SubscriptionStatus, TIER_LIMITS } from '../billing.js';
import type { Tenant } from '../provisioning.js';
import { createTenant } from '../provisioning.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mapMarketplacePlanToTier, parseMarketplaceWebhookEvent } from '../marketplace.js';

/**
 * Azure Function context (simplified interface)
 */
export interface AzureContext {
  log: (message: string) => void;
  done: (err?: Error, result?: unknown) => void;
  /** HTTP response binding (set by HTTP-triggered functions) */
  res?: AzureHttpResponse;
}

/**
 * Azure HTTP request
 */
export interface AzureHttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
}

/**
 * Azure HTTP response
 */
export interface AzureHttpResponse {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * In-memory storage for demo (replace with Azure Storage in production)
 */
const storage = {
  syncs: new Map<string, CRDTSyncMessage[]>(),
  usage: new Map<string, UsageMetrics>(),
  tenants: new Map<string, Tenant>(),
  marketplaceBilling: new Map<number, Subscription>(),
};

function getHeaderValue(headers: Record<string, string>, headerName: string): string | undefined {
  const target = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return value;
    }
  }

  return undefined;
}

function verifyMarketplaceSignature(
  body: string,
  signatureHeader: string,
  secret: string
): boolean {
  const [algorithm, digest] = signatureHeader.split('=');
  if (!algorithm || !digest) {
    return false;
  }

  const normalizedAlgorithm = algorithm.toLowerCase();
  if (normalizedAlgorithm !== 'sha256' && normalizedAlgorithm !== 'sha1') {
    return false;
  }

  const expectedDigest = createHmac(normalizedAlgorithm, secret).update(body, 'utf8').digest('hex');
  const expectedValue = `${normalizedAlgorithm}=${expectedDigest}`;
  const providedBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedValue, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function buildMarketplaceSubscription(
  event: ReturnType<typeof parseMarketplaceWebhookEvent>
): Subscription {
  if (!event) {
    throw new Error('Cannot build subscription from invalid event');
  }

  const tier = mapMarketplacePlanToTier(event.marketplacePurchase.account.plan);
  const fallbackPeriodEnd = event.marketplacePurchase.nextBillingDate
    ? new Date(event.marketplacePurchase.nextBillingDate).getTime()
    : undefined;
  const cancelledAt = event.effectiveDate ? new Date(event.effectiveDate).getTime() : fallbackPeriodEnd;

  return {
    tier,
    status: event.action === 'cancelled' ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE,
    provider: BillingProvider.MARKETPLACE,
    marketplacePlanId: event.marketplacePurchase.account.plan.id,
    startDate: Date.now(),
    periodEnd: event.action === 'cancelled' ? cancelledAt : fallbackPeriodEnd,
    autoRenew: event.action !== 'cancelled',
    limits: TIER_LIMITS[tier],
  };
}

/**
 * Health check endpoint
 * GET /health
 */
export async function healthEndpoint(
  context: AzureContext,
  _req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Health check requested');

  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: Date.now(),
    version: '0.1.0',
    services: {
      relay: true,
      eventGrid: true,
      storage: true,
      auth: true,
    },
  };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: response,
  };
}

/**
 * CRDT sync endpoint
 * POST /sync
 */
export async function syncEndpoint(
  context: AzureContext,
  req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Sync request received');

  // Validate request
  if (req.method !== 'POST') {
    return {
      status: 405,
      body: { error: 'Method not allowed' },
    };
  }

  const message = req.body as CRDTSyncMessage;

  if (!message || !message.appId) {
    return {
      status: 400,
      body: { error: 'Invalid sync message' },
    };
  }

  // Store sync message
  const appSyncs = storage.syncs.get(message.appId) || [];
  appSyncs.push(message);
  storage.syncs.set(message.appId, appSyncs);

  // Update usage metrics
  const usage = storage.usage.get(message.appId) || {
    appId: message.appId,
    syncCount: 0,
    eventCount: 0,
    factCount: 0,
    storageBytes: 0,
    periodStart: Date.now(),
    periodEnd: Date.now(),
  };

  usage.syncCount++;
  usage.eventCount += message.events?.length || 0;
  usage.factCount += message.facts?.length || 0;
  usage.storageBytes += JSON.stringify(message).length;
  usage.periodEnd = Date.now();

  storage.usage.set(message.appId, usage);

  context.log(`Synced for app ${message.appId}: ${usage.syncCount} total syncs`);

  // Return updated vector clock
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      success: true,
      clock: message.clock,
      timestamp: Date.now(),
    },
  };
}

/**
 * Usage metrics endpoint
 * GET /usage?appId=<appId>
 */
export async function usageEndpoint(
  context: AzureContext,
  req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Usage metrics requested');

  const appId = req.query.appId;

  if (!appId) {
    return {
      status: 400,
      body: { error: 'appId query parameter is required' },
    };
  }

  const usage = storage.usage.get(appId);

  if (!usage) {
    return {
      status: 404,
      body: { error: 'No usage data found for this app' },
    };
  }

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: usage,
  };
}

/**
 * Stats endpoint for aggregated metrics
 * GET /stats?appId=<appId>
 */
export async function statsEndpoint(
  context: AzureContext,
  req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Stats requested');

  const appId = req.query.appId;

  if (!appId) {
    return {
      status: 400,
      body: { error: 'appId query parameter is required' },
    };
  }

  const usage = storage.usage.get(appId);
  const syncs = storage.syncs.get(appId) || [];

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      appId,
      totalSyncs: syncs.length,
      usage: usage || null,
      lastSync: syncs.length > 0 ? syncs[syncs.length - 1].timestamp : null,
    },
  };
}

/**
 * Event forwarding endpoint
 * POST /events
 */
export async function eventsEndpoint(
  context: AzureContext,
  req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Event forwarding requested');

  if (req.method !== 'POST') {
    return {
      status: 405,
      body: { error: 'Method not allowed' },
    };
  }

  const { appId, events } = req.body as { appId: string; events: unknown[] };

  if (!appId || !events) {
    return {
      status: 400,
      body: { error: 'Invalid event forwarding request' },
    };
  }

  context.log(`Forwarding ${events.length} events for app ${appId}`);

  // In production, publish to Azure Event Grid / Service Bus
  // For now, just acknowledge receipt
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      success: true,
      forwarded: events.length,
      timestamp: Date.now(),
    },
  };
}

/**
 * Schema registry endpoint
 * GET /schema?appId=<appId>
 * POST /schema (to register a schema)
 */
export async function schemaEndpoint(
  context: AzureContext,
  req: AzureHttpRequest
): Promise<AzureHttpResponse> {
  context.log('Schema registry requested');

  if (req.method === 'POST') {
    const { appId, schema } = req.body as { appId: string; schema: unknown };

    if (!appId || !schema) {
      return {
        status: 400,
        body: { error: 'Invalid schema registration request' },
      };
    }

    context.log(`Schema registered for app ${appId}`);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        success: true,
        schemaId: `${appId}-${Date.now()}`,
        timestamp: Date.now(),
      },
    };
  }

  // GET request
  const appId = req.query.appId;

  if (!appId) {
    return {
      status: 400,
      body: { error: 'appId query parameter is required' },
    };
  }

  // Return placeholder schema
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      appId,
      schema: null,
      message: 'Schema not found',
    },
  };
}

/**
 * GitHub Marketplace webhook endpoint
 * POST /marketplace/webhook
 */
export async function marketplaceWebhookEndpoint(
  context: AzureContext,
  req: AzureHttpRequest & { rawBody?: string }
): Promise<AzureHttpResponse> {
  context.log('Marketplace webhook received');

  if (req.method !== 'POST') {
    return {
      status: 405,
      body: { error: 'Method not allowed' },
    };
  }

  const signature =
    getHeaderValue(req.headers, 'x-hub-signature-256') ??
    getHeaderValue(req.headers, 'x-hub-signature');
  const secret = process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return {
      status: 401,
      body: { error: 'Missing webhook signature or configured secret' },
    };
  }

  const body = req.rawBody ?? JSON.stringify(req.body ?? {});
  if (!verifyMarketplaceSignature(body, signature, secret)) {
    return {
      status: 401,
      body: { error: 'Invalid webhook signature' },
    };
  }

  const event = parseMarketplaceWebhookEvent(req.body);
  if (!event) {
    return {
      status: 400,
      body: { error: 'Invalid marketplace webhook payload' },
    };
  }

  const account = event.marketplacePurchase.account;
  const tenantId = `github-${account.id}`;
  const subscription = buildMarketplaceSubscription(event);
  const existingTenant = storage.tenants.get(tenantId);

  if (existingTenant) {
    existingTenant.subscription = subscription;
    existingTenant.lastAccessedAt = Date.now();
    storage.tenants.set(tenantId, existingTenant);
  } else {
    const tenant = createTenant(
      {
        id: account.id,
        login: account.login,
      },
      subscription
    );
    storage.tenants.set(tenant.id, tenant);
  }

  storage.marketplaceBilling.set(account.id, subscription);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      success: true,
      action: event.action,
      tenantId,
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        provider: subscription.provider,
        marketplacePlanId: subscription.marketplacePlanId,
      },
    },
  };
}
