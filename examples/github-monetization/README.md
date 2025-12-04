# GitHub Monetization Integration Example

This example demonstrates how to integrate GitHub-based authentication and billing into your Praxis Cloud application.

## Features Demonstrated

- GitHub OAuth device flow authentication
- GitHub Sponsors subscription checking
- Automatic tenant provisioning
- Feature access control based on subscription tier
- Usage limit validation

## Running the Example

```bash
# Build the project
npm run build

# Run the example
node dist/examples/github-monetization/index.js
```

## Usage in Your Application

### 1. Authenticate Users

```typescript
import { authenticateWithDeviceFlow } from '@plures/praxis/cloud';

const authResult = await authenticateWithDeviceFlow('YOUR_CLIENT_ID');
if (authResult.success) {
  console.log(`Authenticated as ${authResult.user?.login}`);
}
```

### 2. Check Subscription Status

```typescript
import { createSponsorsClient } from '@plures/praxis/cloud';

const client = createSponsorsClient(token);
const subscription = await client.getSubscription(username);
console.log(`Tier: ${subscription.tier}`);
```

### 3. Provision Tenant

```typescript
import { provisionTenant } from '@plures/praxis/cloud';

const result = await provisionTenant(githubUser, subscription);
if (result.success) {
  console.log(`Storage: ${result.tenant?.storageNamespace}`);
}
```

### 4. Check Feature Access

```typescript
import { hasAccessToTier, SubscriptionTier } from '@plures/praxis/cloud';

if (hasAccessToTier(subscription, SubscriptionTier.TEAM)) {
  // Enable team features
}
```

### 5. Validate Usage

```typescript
import { checkUsageLimits } from '@plures/praxis/cloud';

const result = checkUsageLimits(subscription, {
  syncCount: 45000,
  storageBytes: 800 * 1024 * 1024,
  teamMembers: 1,
  appCount: 8,
});

if (!result.withinLimits) {
  console.log('Exceeded limits:', result.violations);
}
```

## CLI Commands

The Praxis CLI provides convenient commands for authentication and cloud management:

```bash
# Authenticate with GitHub
praxis login

# Check authentication status
praxis whoami

# Initialize cloud connection
praxis cloud init

# Check cloud status
praxis cloud status

# View usage metrics
praxis cloud usage

# Log out
praxis logout
```

## Environment Variables

```bash
# GitHub OAuth Client ID (for device flow)
GITHUB_CLIENT_ID=your_client_id

# Or use a personal access token
GITHUB_TOKEN=ghp_xxxxx
```

## Subscription Tiers

- **Free**: 1,000 syncs/month, 10 MB storage, 1 app
- **Solo**: 50,000 syncs/month, 1 GB storage, 10 apps
- **Team**: 500,000 syncs/month, 10 GB storage, 50 apps, 10 team members
- **Enterprise**: 5M syncs/month, 100 GB storage, 1,000 apps, unlimited team members

## Learn More

- [Monetization Documentation](../../docs/MONETIZATION.md)
- [GitHub Sponsors](https://github.com/sponsors/plures)
- [Praxis Cloud README](../../src/cloud/README.md)
