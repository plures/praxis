# Bot Activity Logs Index

This directory contains weekly logs of automated bot activities in the Praxis repository.
Each log captures dependency updates, version bumps, and other automated maintenance tasks.

## Purpose
- Track bot activities even when no GitHub issue is created
- Provide audit trail for automated changes
- Enable review of batch updates over time
- Reduce PR/commit churn by batching weekly updates

## How It Works

1. **Weekly Schedule**: Automated logs are generated every Monday at 10:00 UTC
2. **Batch Updates**: Dependabot and other bot updates are grouped and reviewed weekly
3. **Audit Trail**: Each weekly log includes:
   - Summary of all bot PRs merged that week
   - Links to upstream changes and release notes
   - Impact assessment (breaking changes, security fixes)
   - Testing status

## Configuration

Bot update behavior is controlled by:
- `.github/dependabot.yml` - Dependency update grouping and scheduling
- `.github/workflows/bot-weekly-log.yml` - Weekly activity logging
- `.github/BOT_PR_TEMPLATE.md` - Standard PR format for bot updates

## Weekly Logs

<!-- Log entries will be added automatically by the bot-weekly-log workflow -->
*No logs yet. The first log will be generated on the next Monday after this file is committed.*
