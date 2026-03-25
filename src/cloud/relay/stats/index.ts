/**
 * Azure Function: Stats
 */

import type { AzureContext, AzureHttpRequest } from '../endpoints.js';
import { statsEndpoint } from '../endpoints.js';

export default async function (context: AzureContext, req: AzureHttpRequest) {
  const response = await statsEndpoint(context, req);
  context.res = response;
}
