/**
 * GitHub Monetization Integration Example
 *
 * Demonstrates how to use GitHub-based authentication and billing
 * in a Praxis Cloud application.
 */

import {
  authenticateWithDeviceFlow,
  createSponsorsClient,
  provisionTenant,
  checkUsageLimits,
  hasAccessToTier,
  SubscriptionTier,
} from '@plures/praxis/cloud';

/**
 * Example: Authenticate user and check their subscription
 */
async function authenticateAndCheckSubscription() {
  console.log('=== Authentication Example ===\n');

  // 1. Authenticate with GitHub using device flow
  const authResult = await authenticateWithDeviceFlow('YOUR_CLIENT_ID');

  if (!authResult.success || !authResult.token || !authResult.user) {
    console.error('Authentication failed');
    return;
  }

  console.log(`✓ Authenticated as ${authResult.user.login}`);

  // 2. Check GitHub Sponsors subscription
  const sponsorsClient = createSponsorsClient(authResult.token);
  const subscription = await sponsorsClient.getSubscription(authResult.user.login);

  console.log(`\nSubscription Details:`);
  console.log(`  Tier: ${subscription.tier}`);
  console.log(`  Status: ${subscription.status}`);
  console.log(`  Provider: ${subscription.provider}`);
  console.log(`\nLimits:`);
  console.log(`  Syncs/month: ${subscription.limits.maxSyncsPerMonth.toLocaleString()}`);
  console.log(`  Storage: ${(subscription.limits.maxStorageBytes / 1024 / 1024).toFixed(0)} MB`);
  console.log(`  Apps: ${subscription.limits.maxApps}`);
  console.log(`  Team members: ${subscription.limits.maxTeamMembers ?? 'Unlimited'}`);

  // 3. Provision tenant based on GitHub identity
  const provisionResult = await provisionTenant(authResult.user, subscription);

  if (provisionResult.success && provisionResult.tenant) {
    console.log(`\n✓ Tenant provisioned:`);
    console.log(`  ID: ${provisionResult.tenant.id}`);
    console.log(`  Storage namespace: ${provisionResult.tenant.storageNamespace}`);
  }

  return {
    user: authResult.user,
    subscription,
    tenant: provisionResult.tenant,
  };
}

/**
 * Example: Check if user has access to a feature
 */
function checkFeatureAccess(subscription: any, featureTier: SubscriptionTier) {
  console.log('\n=== Feature Access Check ===\n');

  const hasAccess = hasAccessToTier(subscription, featureTier);

  if (hasAccess) {
    console.log(`✓ User has access to ${featureTier} features`);
  } else {
    console.log(`✗ User does not have access to ${featureTier} features`);
    console.log(`  Current tier: ${subscription.tier}`);
    console.log(`  Required tier: ${featureTier}`);
  }

  return hasAccess;
}

/**
 * Example: Validate usage against limits
 */
function validateUsage(subscription: any, currentUsage: any) {
  console.log('\n=== Usage Validation ===\n');

  const result = checkUsageLimits(subscription, currentUsage);

  if (result.withinLimits) {
    console.log('✓ Usage is within limits');
  } else {
    console.log('✗ Usage limits exceeded:');
    result.violations.forEach((v) => console.log(`  - ${v}`));
  }

  return result;
}

/**
 * Main example
 */
async function main() {
  try {
    // Authenticate and get subscription
    const userInfo = await authenticateAndCheckSubscription();

    if (!userInfo) {
      return;
    }

    // Check feature access
    checkFeatureAccess(userInfo.subscription, SubscriptionTier.TEAM);

    // Validate current usage
    const currentUsage = {
      syncCount: 45000,
      storageBytes: 800 * 1024 * 1024, // 800 MB
      teamMembers: 1,
      appCount: 8,
    };

    validateUsage(userInfo.subscription, currentUsage);

    console.log('\n=== Example Complete ===\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { authenticateAndCheckSubscription, checkFeatureAccess, validateUsage };
