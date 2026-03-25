/**
 * Azure Function: Usage Metrics
 */

import type { AzureContext, AzureHttpRequest } from '../endpoints.js';
import { usageEndpoint } from '../endpoints.js';

export default async function (context: AzureContext, req: AzureHttpRequest) {
  const response = await usageEndpoint(context, req);
  context.res = response;
}
