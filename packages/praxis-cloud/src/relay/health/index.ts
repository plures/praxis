/**
 * Azure Function: Health Check
 */

import type { AzureContext, AzureHttpRequest } from '../endpoints.js';
import { healthEndpoint } from '../endpoints.js';

export default async function (context: AzureContext, req: AzureHttpRequest) {
  const response = await healthEndpoint(context, req);
  context.res = response;
}
