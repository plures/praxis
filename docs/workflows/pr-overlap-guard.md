# PR Overlap Guard

## Overview

The Praxis PR Overlap Guard is an automated workflow that helps prevent duplicate work by detecting when a new pull request may overlap with existing open pull requests.

## How It Works

The workflow runs automatically when a PR is opened, synchronized, or reopened. It:

1. **Title Similarity Check**: Uses character trigram analysis to detect similar PR titles
   - Normalizes titles (lowercase, removes special characters)
   - Computes Jaccard coefficient of character trigrams
   - Flags titles with >60% similarity

2. **Code Overlap Check**: Analyzes diff signatures to detect similar changes
   - Compares changed file paths
   - Analyzes added/removed line counts
   - Flags code with >50% overlap

3. **Automated Alerts**: Posts a comment on the PR if potential overlaps are detected
   - Lists similar PRs with links
   - Shows similarity percentages
   - Allows manual verification

## Thresholds

- **Title Similarity**: 60% or higher triggers an alert
- **Patch Overlap**: 50% or higher triggers an alert
- PRs meeting either threshold will generate an alert

## Response to Alerts

If you receive an overlap alert:

1. Review the linked PRs to understand the overlap
2. If your PR is intentionally similar (e.g., alternative approach), add a comment explaining the difference
3. If it's a genuine duplicate, consider coordinating with the other PR author
4. The alert is informational - you can proceed if you believe your PR is distinct

## Technical Details

- **Algorithm**: Custom trigram-based string similarity + file/line change analysis
- **Performance**: Only computes expensive patch comparisons when titles are >30% similar
- **Dependencies**: Uses GitHub CLI (`gh`) for fetching PR data

## Files

- Workflow: `.github/workflows/praxis-pr-overlap-guard.yml`
- Documentation: `docs/workflows/pr-overlap-guard.md` (this file)
