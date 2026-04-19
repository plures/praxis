/**
 * Authentication CLI Commands
 *
 * Commands for authenticating with GitHub for Praxis Cloud access.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { authenticateWithDeviceFlow } from '@plures/praxis-cloud';

/** GitHub user info API response (from /user endpoint) */
interface GitHubUserApiResponse {
  id: number;
  login: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string;
}
import { createSponsorsClient } from '@plures/praxis-cloud';
import type { AuthResult } from '@plures/praxis-cloud';

const AUTH_DIR = path.join(os.homedir(), '.praxis');
const AUTH_FILE = path.join(AUTH_DIR, 'auth.json');
const GITHUB_CLIENT_ID = 'Ov23liQxF7P0BqUxVXHk'; // Demo client ID (replace in production)

interface StoredAuth {
  token: string;
  userId: number;
  userLogin: string;
  userName?: string;
  userEmail?: string;
  authenticatedAt: number;
}

/**
 * Load stored authentication
 */
function loadAuth(): StoredAuth | null {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load authentication:', error);
  }
  return null;
}

/**
 * Save authentication
 */
function saveAuth(auth: StoredAuth): void {
  try {
    // Ensure directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Save with restricted permissions
    fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), { mode: 0o600 });
    console.log(`\n✓ Authentication saved to ${AUTH_FILE}`);
  } catch (error) {
    console.error('Failed to save authentication:', error);
    throw error;
  }
}

/**
 * Delete stored authentication
 */
function deleteAuth(): void {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      fs.unlinkSync(AUTH_FILE);
    }
  } catch (error) {
    console.warn('Failed to delete authentication:', error);
  }
}

/**
 * Login command
 *
 * @param options - Login options; pass `token` to skip the device-flow OAuth prompt
 * @returns A promise that resolves when the login flow completes
 */
export async function loginCommand(options: { token?: string }): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Praxis Cloud Authentication                     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Check if already authenticated
  const existingAuth = loadAuth();
  if (existingAuth) {
    console.log('⚠  Already authenticated');
    console.log(`   User: ${existingAuth.userLogin}`);
    console.log(
      `   Authenticated at: ${new Date(existingAuth.authenticatedAt).toLocaleString()}\n`
    );
    console.log("Run 'praxis logout' to log out first.");
    return;
  }

  let authResult: AuthResult;

  if (options.token) {
    // Use provided token
    console.log('🔐 Using provided personal access token...');

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${options.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Invalid token: ${response.statusText}`);
      }

      const userData = (await response.json()) as GitHubUserApiResponse;

      authResult = {
        success: true,
        token: options.token,
        user: {
          id: userData.id,
          login: userData.login,
          email: userData.email ?? undefined,
          name: userData.name ?? undefined,
          avatarUrl: userData.avatar_url,
        },
      };
    } catch (error) {
      console.error('\n✗ Authentication failed');
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  } else {
    // Use device flow
    console.log('🔐 Authenticating with GitHub device flow...');
    authResult = await authenticateWithDeviceFlow(GITHUB_CLIENT_ID);
  }

  if (!authResult.success || !authResult.token || !authResult.user) {
    console.error('\n✗ Authentication failed');
    process.exit(1);
  }

  console.log(`✓ Authenticated as ${authResult.user.login}`);

  // Check GitHub Sponsors status
  console.log('\n🔍 Checking GitHub Sponsors status...');
  try {
    const sponsorsClient = createSponsorsClient(authResult.token);
    const subscription = await sponsorsClient.getSubscription(authResult.user.login);

    console.log(`✓ Subscription tier: ${subscription.tier}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Provider: ${subscription.provider}`);

    if (subscription.tier === 'free') {
      console.log('\n💡 Upgrade to a paid tier for more features!');
      console.log('   Visit: https://github.com/sponsors/plures');
    }
  } catch (error) {
    console.warn('\n⚠  Could not check Sponsors status');
    console.warn(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Save authentication
  const storedAuth: StoredAuth = {
    token: authResult.token,
    userId: authResult.user.id,
    userLogin: authResult.user.login,
    userName: authResult.user.name,
    userEmail: authResult.user.email,
    authenticatedAt: Date.now(),
  };

  saveAuth(storedAuth);

  console.log('\n✓ Successfully logged in!');
  console.log('\nNext steps:');
  console.log("  • Use 'praxis cloud init' to set up cloud connection");
  console.log("  • Use 'praxis whoami' to check your authentication");
  console.log("  • Use 'praxis cloud status' to check subscription\n");
}

/**
 * Logout command
 *
 * @returns A promise that resolves after the stored credentials are removed
 */
export async function logoutCommand(): Promise<void> {
  const auth = loadAuth();

  if (!auth) {
    console.log('\n✗ Not currently logged in');
    console.log("  Run 'praxis login' to authenticate\n");
    return;
  }

  console.log(`\nLogging out user: ${auth.userLogin}...`);

  deleteAuth();

  console.log('✓ Successfully logged out\n');
}

/**
 * Whoami command
 *
 * @returns A promise that resolves after printing the current user's authentication information
 */
export async function whoamiCommand(): Promise<void> {
  const auth = loadAuth();

  if (!auth) {
    console.log('\n✗ Not currently logged in');
    console.log("  Run 'praxis login' to authenticate\n");
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   Current Authentication                          ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log(`User: ${auth.userLogin}`);
  if (auth.userName) {
    console.log(`Name: ${auth.userName}`);
  }
  if (auth.userEmail) {
    console.log(`Email: ${auth.userEmail}`);
  }
  console.log(`User ID: ${auth.userId}`);
  console.log(`Authenticated: ${new Date(auth.authenticatedAt).toLocaleString()}`);

  // Check token validity
  console.log('\n🔍 Checking token validity...');
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      console.log('✓ Token is valid');

      // Check subscription
      console.log('\n🔍 Checking subscription...');
      const sponsorsClient = createSponsorsClient(auth.token);
      const subscription = await sponsorsClient.getSubscription(auth.userLogin);

      console.log(`Tier: ${subscription.tier}`);
      console.log(`Status: ${subscription.status}`);
      console.log(`Provider: ${subscription.provider}`);
      console.log('\nLimits:');
      console.log(`  Syncs/month: ${subscription.limits.maxSyncsPerMonth.toLocaleString()}`);
      console.log(
        `  Storage: ${(subscription.limits.maxStorageBytes / 1024 / 1024).toFixed(0)} MB`
      );
      console.log(`  Apps: ${subscription.limits.maxApps}`);
      console.log(`  Team members: ${subscription.limits.maxTeamMembers ?? 'Unlimited'}`);
      console.log(`  Support: ${subscription.limits.supportLevel}`);
    } else {
      console.log('✗ Token is invalid or expired');
      console.log("  Run 'praxis login' to re-authenticate");
    }
  } catch (error) {
    console.error('\n✗ Failed to check token validity');
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log();
}

/**
 * Get stored authentication token
 *
 * Used by other commands that need authentication
 *
 * @returns The stored OAuth token, or `null` if the user is not authenticated
 */
export function getAuthToken(): string | null {
  const auth = loadAuth();
  return auth?.token || null;
}
