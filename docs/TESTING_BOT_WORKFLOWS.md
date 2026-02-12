# Testing Bot Update Workflows

This guide explains how to test the new batched bot update workflows.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Appropriate repository permissions (write access)

## Testing Individual Workflows

### 1. Test Weekly Activity Log

```bash
# Trigger manually via GitHub Actions UI
# Go to: Actions → Weekly Bot Activity Log → Run workflow

# Or via GitHub CLI:
gh workflow run bot-weekly-log.yml

# Check the run:
gh run list --workflow=bot-weekly-log.yml

# View the output:
gh run view --log
```

**Expected Result:**
- A new markdown file created in `.github/bot-logs/` with format `YYYY-Wxx.md`
- The INDEX.md file updated with a link to the new log
- Commit pushed to main branch with message: `chore: update bot activity log for week YYYY-Wxx`

### 2. Test Batch Pin Bumps

```bash
# Trigger manually via GitHub Actions UI with force_update option
# Go to: Actions → Batch Pin Bumps (Weekly) → Run workflow → Set force_update to 'true'

# Or via GitHub CLI:
gh workflow run batch-pin-bumps.yml -f force_update=true

# Check the run:
gh run list --workflow=batch-pin-bumps.yml

# Check for created PR:
gh pr list --label bot-update
```

**Expected Result:**
- A new branch created: `bot/weekly-pins-YYYY-Wxx`
- A PR opened with title: `chore(deps): weekly pin bumps - YYYY-Wxx`
- PR uses the BOT_PR_TEMPLATE.md format
- PR labeled with: `dependencies`, `bot-update`, `automated-pins`

### 3. Test Dependabot Grouping

Dependabot runs automatically on schedule, but you can verify configuration:

```bash
# Check dependabot configuration
cat .github/dependabot.yml

# View existing dependabot PRs
gh pr list --author "dependabot[bot]"

# Check for grouped PRs (should see fewer, larger PRs)
gh pr list --author "dependabot[bot]" --label dependencies
```

**Expected Result:**
- Dependabot creates grouped PRs like:
  - "Bump the npm-production group with X updates"
  - "Bump the npm-dev-tools group with Y updates"
  - "Bump the github-actions group with Z updates"

## Integration Testing

### Weekly Workflow Sequence

The workflows run in this order:
1. **08:00 UTC Monday**: `batch-pin-bumps.yml` (creates PR)
2. **09:00 UTC Monday**: Dependabot runs (creates grouped PRs)
3. **10:00 UTC Monday**: `bot-weekly-log.yml` (logs previous week's activity)

To test the full sequence:

1. Manually trigger batch-pin-bumps on a Monday
2. Review and merge the created PR
3. Let dependabot run naturally or configure it to run more frequently for testing
4. Manually trigger bot-weekly-log
5. Check `.github/bot-logs/` for the generated log

## Validation Checklist

After implementing the bot update approach, verify:

- [ ] Dependabot creates grouped PRs (not individual dependency PRs)
- [ ] Bot PRs use the standard template format
- [ ] Weekly logs are generated in `.github/bot-logs/`
- [ ] INDEX.md is updated automatically
- [ ] All bot PRs have `bot-update` label
- [ ] Commit messages follow pattern: `chore(deps): ...`
- [ ] No direct commits to main (all updates via PR)

## Troubleshooting

### Workflow Fails with Permission Error

Ensure the workflow has appropriate permissions in `.github/workflows/*.yml`:
```yaml
permissions:
  contents: write
  pull-requests: write
```

### Bot Logs Not Committing

Check that:
- Git user is configured in the workflow
- GITHUB_TOKEN has write access to the repository
- Branch protection rules allow bot commits

### No PRs Created

Verify:
- Changes were actually detected (check step output)
- Branch doesn't already exist
- PR limit not reached (dependabot config: open-pull-requests-limit)

### Dependabot Not Grouping

Ensure:
- Using Dependabot v2 configuration format
- `groups:` section is properly configured
- Updates match the group patterns

## Manual Rollback

If you need to revert the bot update approach:

1. Restore original `.github/dependabot.yml`
2. Disable or delete the new workflows:
   - `.github/workflows/bot-weekly-log.yml`
   - `.github/workflows/batch-pin-bumps.yml`
3. Remove `.github/bot-logs/` directory
4. Remove `.github/BOT_PR_TEMPLATE.md`

## Next Steps

Once testing is complete:
1. Monitor for one full week to ensure all workflows run correctly
2. Review the generated logs for completeness
3. Adjust schedules or grouping as needed
4. Share the approach with other Plures repositories
