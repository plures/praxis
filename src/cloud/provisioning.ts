/**
 * Auto-Provisioning
 *
 * Automatic tenant/storage provisioning based on GitHub identity.
 */

import type { GitHubUser } from './types.js';
import type { Subscription } from './billing.js';

/**
 * Tenant information
 */
export interface Tenant {
  /**
   * Tenant ID (derived from GitHub user/org)
   */
  id: string;

  /**
   * GitHub user ID
   */
  githubUserId: number;

  /**
   * GitHub login (username or org name)
   */
  githubLogin: string;

  /**
   * Tenant type
   */
  type: 'user' | 'organization';

  /**
   * Subscription
   */
  subscription: Subscription;

  /**
   * Storage namespace
   */
  storageNamespace: string;

  /**
   * Creation timestamp
   */
  createdAt: number;

  /**
   * Last accessed timestamp
   */
  lastAccessedAt: number;
}

/**
 * Generate a storage namespace from GitHub login
 *
 * Namespace format: gh-{login}-{hash}
 * This ensures uniqueness and follows Azure Blob Storage naming rules.
 *
 * @param githubLogin - The GitHub user login (username)
 * @param userId - The GitHub numeric user ID used to create a unique hash suffix
 * @returns A storage namespace string safe for use as an Azure Blob Storage container name
 */
export function generateStorageNamespace(githubLogin: string, userId: number): string {
  // Sanitize login: lowercase, replace non-alphanumeric with hyphens
  const sanitized = githubLogin.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Create a simple hash from user ID for uniqueness
  const hash = userId.toString(36).padStart(6, '0');

  // Combine with prefix
  return `gh-${sanitized}-${hash}`;
}

/**
 * Generate tenant ID from GitHub user
 *
 * @param githubUser - The GitHub user object containing the numeric ID
 * @returns A stable tenant ID string of the form `"github-{userId}"`
 */
export function generateTenantId(githubUser: GitHubUser): string {
  return `github-${githubUser.id}`;
}

/**
 * Create a tenant from GitHub user
 *
 * @param githubUser - The authenticated GitHub user whose tenant is being created
 * @param subscription - The subscription tier to associate with this tenant
 * @returns A new {@link Tenant} object with storage namespace and timestamps set
 */
export function createTenant(githubUser: GitHubUser, subscription: Subscription): Tenant {
  const tenantId = generateTenantId(githubUser);
  const storageNamespace = generateStorageNamespace(githubUser.login, githubUser.id);

  return {
    id: tenantId,
    githubUserId: githubUser.id,
    githubLogin: githubUser.login,
    type: 'user', // Could be "organization" if checking org membership
    subscription,
    storageNamespace,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
}

/**
 * Validate storage namespace
 *
 * Ensures namespace follows Azure Blob Storage naming rules:
 * - 3-63 characters
 * - lowercase letters, numbers, and hyphens only
 * - must start with letter or number
 * - no consecutive hyphens
 *
 * @param namespace - The storage namespace string to validate
 * @returns An object with `valid: true` on success, or `valid: false` and an `error` message on failure
 */
export function validateStorageNamespace(namespace: string): {
  valid: boolean;
  error?: string;
} {
  if (namespace.length < 3 || namespace.length > 63) {
    return {
      valid: false,
      error: 'Namespace must be 3-63 characters',
    };
  }

  if (!/^[a-z0-9]/.test(namespace)) {
    return {
      valid: false,
      error: 'Namespace must start with a letter or number',
    };
  }

  if (!/^[a-z0-9-]+$/.test(namespace)) {
    return {
      valid: false,
      error: 'Namespace can only contain lowercase letters, numbers, and hyphens',
    };
  }

  if (/--/.test(namespace)) {
    return {
      valid: false,
      error: 'Namespace cannot contain consecutive hyphens',
    };
  }

  return { valid: true };
}

/**
 * Get storage container name for an app
 *
 * @param tenantNamespace - The tenant's storage namespace (from {@link generateStorageNamespace})
 * @param appId - The application identifier
 * @returns A storage container name combining the tenant namespace and sanitized app ID
 */
export function getAppStorageContainer(tenantNamespace: string, appId: string): string {
  // Sanitize app ID
  const sanitizedAppId = appId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${tenantNamespace}-${sanitizedAppId}`;
}

/**
 * Provisioning result
 */
export interface ProvisioningResult {
  /**
   * Whether provisioning was successful
   */
  success: boolean;

  /**
   * Tenant (if successful)
   */
  tenant?: Tenant;

  /**
   * Error message (if failed)
   */
  error?: string;
}

/**
 * Provision a new tenant
 *
 * This would typically:
 * 1. Create storage containers
 * 2. Set up access policies
 * 3. Initialize tenant metadata
 * 4. Register with billing system
 */
export async function provisionTenant(
  githubUser: GitHubUser,
  subscription: Subscription
): Promise<ProvisioningResult> {
  try {
    const tenant = createTenant(githubUser, subscription);

    // Validate storage namespace
    const validation = validateStorageNamespace(tenant.storageNamespace);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // TODO: In production, this would:
    // 1. Create Azure Blob Storage container
    // 2. Set up access policies
    // 3. Store tenant metadata in database
    // 4. Send welcome email
    // 5. Log provisioning event

    console.log(`Provisioned tenant: ${tenant.id}`);
    console.log(`Storage namespace: ${tenant.storageNamespace}`);

    return {
      success: true,
      tenant,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get or create tenant
 *
 * Checks if tenant exists, creates if not.
 */
export async function getOrCreateTenant(
  githubUser: GitHubUser,
  subscription: Subscription,
  tenantLookup: (id: string) => Promise<Tenant | null>
): Promise<Tenant> {
  const tenantId = generateTenantId(githubUser);

  // Try to get existing tenant
  const existing = await tenantLookup(tenantId);
  if (existing) {
    // Update last accessed time
    existing.lastAccessedAt = Date.now();
    return existing;
  }

  // Provision new tenant
  const result = await provisionTenant(githubUser, subscription);
  if (!result.success || !result.tenant) {
    throw new Error(`Failed to provision tenant: ${result.error}`);
  }

  return result.tenant;
}
