# CI/CD Pipeline

This document describes the automated continuous integration and deployment pipeline for the Praxis framework.

## Overview

The Praxis CI/CD pipeline is fully automated, ensuring that code merged into the `main` branch flows automatically through version bumping, tagging, release creation, and publishing to all package repositories in parallel.

## Pipeline Flow

```
PR Merged to main
    ↓
Auto Version Bump (based on semver labels)
    ↓
Create Git Tag (v*.*.*)
    ↓
Run Tests & Build
    ↓
Create GitHub Release
    ↓
Publish to Repositories (Parallel)
    ├─→ NPM
    ├─→ JSR (JavaScript Registry)
    └─→ NuGet
```

## Workflow Details

### 1. Auto Version Bump (`auto-version-bump.yml`)

**Trigger**: When a PR is merged to `main`

**Process**:
- Determines version bump level based on PR labels:
  - `semver:major` → Major version bump (e.g., 1.0.0 → 2.0.0)
  - `semver:minor` → Minor version bump (e.g., 1.0.0 → 1.1.0)
  - `semver:patch` → Patch version bump (e.g., 1.0.0 → 1.0.1) - **default**
- Updates `package.json` version
- Creates and pushes a git tag (e.g., `v1.2.3`)

**Requirements**: Add one of the semver labels to your PR to control the version bump.

### 2. Release Creation (`release.yml`)

**Trigger**: When a tag matching `v*.*.*` is pushed (automatically triggered by auto-version-bump)

**Process**:
- Checks out code at the tagged version
- Runs full test suite
- Builds the project
- Creates a GitHub Release with changelog
- Automatically triggers the publish workflow

### 3. Publishing (`publish.yml`)

**Trigger**: Called automatically by `release.yml` after release creation

**Process**: Three parallel publishing jobs run simultaneously:

#### NPM Publishing
- Builds the TypeScript/Node.js package
- Publishes to npm registry as `@plures/praxis`
- Requires `NPM_TOKEN` secret

#### JSR Publishing  
- Publishes to JavaScript Registry (JSR) using Deno
- Publishes as `@plures/praxis`
- Uses OIDC authentication
- Note: Uses `--allow-dirty` flag to allow publishing from clean checkout state

#### NuGet Publishing
- Extracts version from the most recent git tag
- Updates version in `.csproj` file before building
- Builds the C# package
- Runs C# tests
- Publishes to NuGet.org as `Praxis`
- Requires `NUGET_API_KEY` secret

**Note**: When the publish workflow is called from the release workflow, it extracts version information from the git tags instead of relying on GitHub context, ensuring consistent versioning across all published packages.

## Additional Workflows

### CI (`ci.yml`)

**Trigger**: On push to `main` or pull request

**Purpose**: Validates code quality before merging
- Runs tests on multiple Node.js versions (18.x, 20.x)
- Runs C# tests on .NET 8
- Performs Deno compatibility checks

### C# Build Check (`publish-nuget.yml`)

**Trigger**: On push to `main` or pull request

**Purpose**: Validates C# code builds and tests pass
- Ensures C# codebase is always in a buildable state
- Runs independently of publishing workflow

## Secrets Required

The following secrets must be configured in the GitHub repository:

- `NPM_TOKEN`: NPM authentication token for publishing packages
- `NUGET_API_KEY`: NuGet API key for publishing packages

## Manual Triggers

The main pipeline workflows support `workflow_dispatch`, allowing manual triggering when needed:

- **Release Workflow**: Manually create a release and publish for the current state
- **Publish Workflow**: Re-publish to all repositories without creating a new release
- **C# Build Check**: Manually validate C# code builds and tests (separate from publishing)

## Best Practices

1. **Always label your PRs**: Use semver labels (`semver:major`, `semver:minor`, or `semver:patch`) to control version bumping
2. **Review before merging**: Once merged to `main`, the entire pipeline runs automatically
3. **Monitor releases**: Check the Actions tab to ensure all publishing jobs complete successfully
4. **Breaking changes**: Use `semver:major` for breaking changes
5. **New features**: Use `semver:minor` for new features
6. **Bug fixes**: Use `semver:patch` for bug fixes and patches

## Troubleshooting

### Publishing failures

If any publishing job fails:
1. Check the Actions tab for detailed error logs
2. Verify all required secrets are configured
3. The workflow can be manually re-triggered using `workflow_dispatch`

### Version conflicts

If version bumping fails:
1. Ensure no manual version changes conflict with automated bumping
2. Check that the main branch is up to date

### Parallel publishing

All three repositories (NPM, JSR, NuGet) publish in parallel. If one fails, the others will continue. Check individual job logs for failures.
