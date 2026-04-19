/**
 * Azure Function: CRDT Sync
 */

import type { AzureContext, AzureHttpRequest } from '../endpoints.js';
import { syncEndpoint } from '../endpoints.js';

export default async function (context: AzureContext, req: AzureHttpRequest) {
  const response = await syncEndpoint(context, req);
  context.res = response;
}
