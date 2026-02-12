# Bot Update Policy

## Overview

This document describes how automated updates (dependency bumps, pin updates, etc.) are managed in the Praxis repository to reduce commit churn and improve reviewability.

## Goals

1. **Batch Updates**: Group related updates together instead of creating many small PRs
2. **Improve Auditability**: Require summaries and upstream links for all bot PRs
3. **Maintain Tracking**: Keep audit trail even without dedicated GitHub issues
4. **Reduce Noise**: Weekly batching instead of continuous small updates

## How It Works

### Dependabot Configuration

Dependabot is configured to:
- Run weekly on Mondays at 09:00 UTC
- Group updates by ecosystem (npm production, npm dev, github-actions)
- Limit to 5 open PRs at a time
- Use consistent labels: `dependencies`, `bot-update`
- Follow standardized commit message format: `chore(deps): ...`

See `.github/dependabot.yml` for full configuration.

### Weekly Pin Bumps

The `batch-pin-bumps.yml` workflow:
- Runs every Monday at 08:00 UTC (before dependabot)
- Checks for lockfile updates (pnpm-lock.yaml, package-lock.json)
- Creates a single PR with all pin bumps for the week
- Uses the standard bot PR template for consistency

### Weekly Activity Log

The `bot-weekly-log.yml` workflow:
- Runs every Monday at 10:00 UTC (after updates run)
- Collects all bot PRs merged in the past week
- Creates a weekly activity log in `.github/bot-logs/`
- Provides audit trail without requiring GitHub issues
- Commits log directly to main branch

### PR Template

All bot PRs use `.github/BOT_PR_TEMPLATE.md` which requires:
- Brief summary of changes
- List of updated dependencies/files
- Links to upstream changelogs or release notes
- Impact assessment (breaking changes, security, testing)
- Weekly batch identifier for tracking

## For Repository Maintainers

### Reviewing Bot PRs

When reviewing automated PRs:

1. **Check the Summary**: Understand what's being updated
2. **Review Upstream Links**: Look for breaking changes or security fixes
3. **Verify CI Passes**: Ensure all tests and checks pass
4. **Check Impact Assessment**: Pay attention to flagged items
5. **Merge Weekly Batches**: Approve and merge to reduce backlog

### Customizing Pin Updates

To add custom pin update checks in `batch-pin-bumps.yml`:

1. Edit the "Check for pin updates" step
2. Add logic to detect your specific pin files
3. Update the summary to describe what changed
4. Test with workflow_dispatch before scheduling

### Adjusting Schedule

To change update frequency:

1. Edit cron schedules in workflow files
2. Update dependabot.yml schedule.interval
3. Coordinate timing (pin bumps → dependabot → weekly log)

## For Other Repositories

This bot update approach can be adopted by other repositories in the Plures organization:

### Setup Steps

1. Copy `.github/dependabot.yml` and adjust for your ecosystem
2. Copy `.github/BOT_PR_TEMPLATE.md`
3. Copy `.github/workflows/bot-weekly-log.yml`
4. (Optional) Copy `.github/workflows/batch-pin-bumps.yml` and customize
5. Create `.github/bot-logs/` directory structure
6. Update your README to reference the new bot policy

### Target Repositories

As mentioned in the original issue, these repos should adopt this approach:
- ✅ plures/praxis (this repo)
- ⬜ plures/nix-openclaw (issues disabled; track here)
- ⬜ plures/praxis-business
- ⬜ plures/behavior-ledger-github-cicd

## References

- Original Issue: Practice: reduce bot churn (batch pin bumps; prefer PRs; add audit trail)
- Dependabot Documentation: https://docs.github.com/en/code-security/dependabot
- GitHub Actions Workflow Syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

## FAQ

### Why weekly instead of daily?

Weekly batching significantly reduces PR volume while still keeping dependencies reasonably up-to-date. Security updates can still be handled immediately through manual intervention.

### What if I need an urgent update?

You can always create a manual PR for urgent updates. The weekly batching is for routine maintenance only.

### Where do I find the weekly logs?

All weekly logs are stored in `.github/bot-logs/` with an index at `.github/bot-logs/INDEX.md`.

### Can I trigger updates manually?

Yes! All workflows support `workflow_dispatch` for manual triggering via the GitHub Actions UI.
