/**
 * Azure Function: GitHub Marketplace Webhook
 */

import type { AzureContext, AzureHttpRequest } from '../endpoints.js';
import { marketplaceWebhookEndpoint } from '../endpoints.js';

export default async function (context: AzureContext, req: AzureHttpRequest) {
  const response = await marketplaceWebhookEndpoint(context, req);
  context.res = response;
}
