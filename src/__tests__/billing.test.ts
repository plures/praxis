/**
 * Billing Tests
 *
 * Tests for billing types and utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  SubscriptionTier,
  SubscriptionStatus,
  BillingProvider,
  TIER_LIMITS,
  hasAccessToTier,
  checkUsageLimits,
  createFreeSubscription,
  createSponsorSubscription,
  createOrgSubscription,
  resolveEffectiveSubscription,
} from '@plures/praxis-cloud';

describe('Billing', () => {
  describe('Tier Limits', () => {
    it('should have limits for all tiers', () => {
      expect(TIER_LIMITS[SubscriptionTier.FREE]).toBeDefined();
      expect(TIER_LIMITS[SubscriptionTier.SOLO]).toBeDefined();
      expect(TIER_LIMITS[SubscriptionTier.TEAM]).toBeDefined();
      expect(TIER_LIMITS[SubscriptionTier.ENTERPRISE]).toBeDefined();
    });

    it('should have increasing limits for higher tiers', () => {
      expect(TIER_LIMITS[SubscriptionTier.SOLO].maxSyncsPerMonth).toBeGreaterThan(
        TIER_LIMITS[SubscriptionTier.FREE].maxSyncsPerMonth
      );
      expect(TIER_LIMITS[SubscriptionTier.TEAM].maxSyncsPerMonth).toBeGreaterThan(
        TIER_LIMITS[SubscriptionTier.SOLO].maxSyncsPerMonth
      );
      expect(TIER_LIMITS[SubscriptionTier.ENTERPRISE].maxSyncsPerMonth).toBeGreaterThan(
        TIER_LIMITS[SubscriptionTier.TEAM].maxSyncsPerMonth
      );
    });
  });

  describe('hasAccessToTier', () => {
    it('should grant access to same tier', () => {
      const subscription = createFreeSubscription();
      expect(hasAccessToTier(subscription, SubscriptionTier.FREE)).toBe(true);
    });

    it('should grant access to lower tiers', () => {
      const subscription = {
        ...createFreeSubscription(),
        tier: SubscriptionTier.ENTERPRISE,
      };
      expect(hasAccessToTier(subscription, SubscriptionTier.FREE)).toBe(true);
      expect(hasAccessToTier(subscription, SubscriptionTier.SOLO)).toBe(true);
      expect(hasAccessToTier(subscription, SubscriptionTier.TEAM)).toBe(true);
    });

    it('should deny access to higher tiers', () => {
      const subscription = createFreeSubscription();
      expect(hasAccessToTier(subscription, SubscriptionTier.SOLO)).toBe(false);
      expect(hasAccessToTier(subscription, SubscriptionTier.TEAM)).toBe(false);
      expect(hasAccessToTier(subscription, SubscriptionTier.ENTERPRISE)).toBe(false);
    });

    it('should deny access if subscription is not active', () => {
      const subscription = {
        ...createFreeSubscription(),
        status: SubscriptionStatus.EXPIRED,
      };
      expect(hasAccessToTier(subscription, SubscriptionTier.FREE)).toBe(false);
    });
  });

  describe('checkUsageLimits', () => {
    it('should pass when usage is within limits', () => {
      const subscription = createFreeSubscription();
      const result = checkUsageLimits(subscription, {
        syncCount: 500,
        storageBytes: 5 * 1024 * 1024, // 5 MB
        teamMembers: 1,
        appCount: 1,
      });
      expect(result.withinLimits).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when sync count exceeds limit', () => {
      const subscription = createFreeSubscription();
      const result = checkUsageLimits(subscription, {
        syncCount: 2000,
        storageBytes: 0,
        teamMembers: 1,
        appCount: 1,
      });
      expect(result.withinLimits).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('Sync limit exceeded');
    });

    it('should fail when storage exceeds limit', () => {
      const subscription = createFreeSubscription();
      const result = checkUsageLimits(subscription, {
        syncCount: 0,
        storageBytes: 20 * 1024 * 1024, // 20 MB
        teamMembers: 1,
        appCount: 1,
      });
      expect(result.withinLimits).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('Storage limit exceeded');
    });

    it('should fail when team members exceed limit', () => {
      const subscription = createFreeSubscription();
      const result = checkUsageLimits(subscription, {
        syncCount: 0,
        storageBytes: 0,
        teamMembers: 5,
        appCount: 1,
      });
      expect(result.withinLimits).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('Team member limit exceeded');
    });

    it('should allow unlimited team members for enterprise', () => {
      const subscription = {
        ...createFreeSubscription(),
        tier: SubscriptionTier.ENTERPRISE,
        limits: TIER_LIMITS[SubscriptionTier.ENTERPRISE],
      };
      const result = checkUsageLimits(subscription, {
        syncCount: 0,
        storageBytes: 0,
        teamMembers: 1000,
        appCount: 1,
      });
      expect(result.withinLimits).toBe(true);
    });
  });

  describe('createFreeSubscription', () => {
    it('should create a free subscription', () => {
      const subscription = createFreeSubscription();
      expect(subscription.tier).toBe(SubscriptionTier.FREE);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.provider).toBe(BillingProvider.NONE);
      expect(subscription.autoRenew).toBe(true);
    });
  });

  describe('createSponsorSubscription', () => {
    it('should create solo tier for $5/month', () => {
      const subscription = createSponsorSubscription('Solo', 500);
      expect(subscription.tier).toBe(SubscriptionTier.SOLO);
      expect(subscription.provider).toBe(BillingProvider.SPONSORS);
    });

    it('should create team tier for $20/month', () => {
      const subscription = createSponsorSubscription('Team', 2000);
      expect(subscription.tier).toBe(SubscriptionTier.TEAM);
      expect(subscription.provider).toBe(BillingProvider.SPONSORS);
    });

    it('should create enterprise tier for $50/month', () => {
      const subscription = createSponsorSubscription('Enterprise', 5000);
      expect(subscription.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(subscription.provider).toBe(BillingProvider.SPONSORS);
    });

    it('should default to free tier for low amounts', () => {
      const subscription = createSponsorSubscription('Supporter', 100);
      expect(subscription.tier).toBe(SubscriptionTier.FREE);
    });
  });

  describe('createOrgSubscription', () => {
    it('should create an enterprise subscription bound to an organization', () => {
      const subscription = createOrgSubscription(12345, 'octo-org', 9002);
      expect(subscription.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.provider).toBe(BillingProvider.MARKETPLACE);
      expect(subscription.accountType).toBe('Organization');
      expect(subscription.organizationId).toBe(12345);
      expect(subscription.organizationLogin).toBe('octo-org');
      expect(subscription.marketplacePlanId).toBe(9002);
      expect(subscription.autoRenew).toBe(true);
    });

    it('should accept optional periodEnd and startDate', () => {
      const subscription = createOrgSubscription(12345, 'octo-org', 9002, {
        periodEnd: 2000000000000,
        startDate: 1000000000000,
      });
      expect(subscription.periodEnd).toBe(2000000000000);
      expect(subscription.startDate).toBe(1000000000000);
    });
  });

  describe('resolveEffectiveSubscription', () => {
    it('should return org subscription when it is higher tier', () => {
      const userSub = createFreeSubscription();
      const orgSub = createOrgSubscription(1, 'org', 1);
      const effective = resolveEffectiveSubscription(userSub, [orgSub]);
      expect(effective.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(effective.organizationId).toBe(1);
    });

    it('should return user subscription when it is higher tier', () => {
      const userSub = {
        ...createFreeSubscription(),
        tier: SubscriptionTier.ENTERPRISE,
        limits: TIER_LIMITS[SubscriptionTier.ENTERPRISE],
      };
      const orgSub = createOrgSubscription(1, 'org', 1);
      orgSub.tier = SubscriptionTier.TEAM;
      orgSub.limits = TIER_LIMITS[SubscriptionTier.TEAM];
      const effective = resolveEffectiveSubscription(userSub, [orgSub]);
      expect(effective.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(effective.organizationId).toBeUndefined();
    });

    it('should skip inactive org subscriptions', () => {
      const userSub = createFreeSubscription();
      const orgSub = createOrgSubscription(1, 'org', 1);
      orgSub.status = SubscriptionStatus.CANCELLED;
      const effective = resolveEffectiveSubscription(userSub, [orgSub]);
      expect(effective.tier).toBe(SubscriptionTier.FREE);
    });

    it('should pick the best among multiple org subscriptions', () => {
      const userSub = createFreeSubscription();
      const orgSub1 = createOrgSubscription(1, 'org1', 1);
      orgSub1.tier = SubscriptionTier.TEAM;
      orgSub1.limits = TIER_LIMITS[SubscriptionTier.TEAM];
      const orgSub2 = createOrgSubscription(2, 'org2', 2);
      const effective = resolveEffectiveSubscription(userSub, [orgSub1, orgSub2]);
      expect(effective.tier).toBe(SubscriptionTier.ENTERPRISE);
      expect(effective.organizationLogin).toBe('org2');
    });
  });
});
