/**
 * Praxis Lifecycle Engine — Review Automation
 *
 * Automates the review → implement recommendations → re-review cycle.
 */

import type {
  TriggerAction,
} from './types.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A request to initiate a code review for a pull request. */
export interface ReviewRequest {
  prNumber: number | string;
  repo: string;
  reviewer: string;
  automated: boolean;
}

/** The result of a code review, including approval status and reviewer comments. */
export interface ReviewResult {
  prNumber: number | string;
  approved: boolean;
  changesRequested: boolean;
  comments: ReviewComment[];
}

/** A single review comment on a pull request, with an optional file path, line number, and severity. */
export interface ReviewComment {
  path?: string;
  line?: number;
  body: string;
  severity: 'suggestion' | 'required' | 'praise';
}

/** Tracks the state of a review-implement-re-review cycle for a pull request across multiple rounds. */
export interface ReviewCycleState {
  prNumber: number | string;
  round: number;
  maxRounds: number;
  status: 'pending-review' | 'changes-requested' | 'changes-applied' | 'approved' | 'max-rounds-exceeded';
  comments: ReviewComment[];
}

// ─── Review Triggers ────────────────────────────────────────────────────────

/** Built-in trigger actions for the review lifecycle phase (CI gating, requesting reviews, and re-review cycles). */
export const review = {
  /**
   * Gate that requires all CI checks to pass before review.
   */
  requireCI(): TriggerAction {
    return {
      id: 'review.require-ci',
      description: 'Require CI to pass before review',
      execute: async (event) => {
        const ciPassed = event.data.ciPassed as boolean | undefined;
        if (ciPassed === false) {
          return {
            success: false,
            message: 'CI has not passed — review blocked',
            error: 'CI must pass before review',
          };
        }
        return { success: true, message: 'CI passed, review can proceed' };
      },
    };
  },

  /**
   * Auto-apply review recommendations (via Copilot or agent).
   */
  autoApplyRecommendations(opts?: { maxRounds?: number }): TriggerAction {
    const maxRounds = opts?.maxRounds ?? 3;
    return {
      id: 'review.auto-apply',
      description: `Auto-apply review recommendations (max ${maxRounds} rounds)`,
      execute: async (event, ctx) => {
        const round = (event.data.round as number) ?? 1;
        const comments = event.data.comments as ReviewComment[] | undefined;

        if (round > maxRounds) {
          ctx.emit('lifecycle/review/review.completed', {
            ...event.data,
            status: 'max-rounds-exceeded',
          });
          return {
            success: false,
            message: `Max review rounds (${maxRounds}) exceeded`,
          };
        }

        const required = (comments ?? []).filter(c => c.severity === 'required');
        if (required.length === 0) {
          ctx.emit('lifecycle/review/review.approved', event.data);
          return {
            success: true,
            message: 'No required changes — approved',
            data: { round, status: 'approved' },
          };
        }

        ctx.emit('lifecycle/review/review.changes-requested', {
          ...event.data,
          requiredChanges: required.length,
          round,
        });

        return {
          success: true,
          message: `${required.length} required changes in round ${round}`,
          data: { round, requiredChanges: required.length },
        };
      },
    };
  },

  /**
   * Merge gate — checks all conditions before allowing merge.
   */
  mergeGate(conditions?: string[]): TriggerAction {
    return {
      id: 'review.merge-gate',
      description: 'Gate: all conditions must be met before merge',
      execute: async (event) => {
        const reviewApproved = event.data.reviewApproved as boolean | undefined;
        const ciPassed = event.data.ciPassed as boolean | undefined;
        const conflicts = event.data.hasConflicts as boolean | undefined;

        const failures: string[] = [];
        if (reviewApproved === false) failures.push('Review not approved');
        if (ciPassed === false) failures.push('CI not passing');
        if (conflicts === true) failures.push('Merge conflicts exist');

        if (failures.length > 0) {
          return {
            success: false,
            message: `Merge blocked: ${failures.join(', ')}`,
            data: { failures },
          };
        }

        return {
          success: true,
          message: 'All merge conditions met',
          data: { conditions: conditions ?? ['review', 'ci', 'no-conflicts'] },
        };
      },
    };
  },
};
