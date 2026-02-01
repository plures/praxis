/**
 * GitHub emitter for praxis-conversations
 * Emits candidates to GitHub as issues (HARD GATED by commit_intent=true)
 */

import type { Candidate, GitHubEmitterOptions, EmissionResult } from '../types.js';

/**
 * CRITICAL: GitHub emitter is HARD GATED by commit_intent=true
 * This ensures no accidental issue creation
 */
export async function emitToGitHub(
  candidate: Candidate,
  options: GitHubEmitterOptions
): Promise<Candidate> {
  const { owner, repo, token, dryRun = false, commitIntent = false } = options;
  
  // HARD GATE: Must have commit_intent=true
  if (!commitIntent) {
    const result: EmissionResult = {
      success: false,
      timestamp: new Date().toISOString(),
      error: 'GATE FAILURE: commit_intent must be explicitly set to true for GitHub emission',
    };
    
    console.error(`[GATE BLOCKED] ${result.error}`);
    
    return {
      ...candidate,
      emitted: false,
      emissionResult: result,
    };
  }
  
  if (dryRun) {
    console.log(`[DRY RUN] Would create GitHub issue in ${owner}/${repo}`);
    console.log(`Title: ${candidate.title}`);
    console.log(`Labels: ${candidate.metadata.labels?.join(', ') || 'none'}`);
    
    return {
      ...candidate,
      emitted: true,
      emissionResult: {
        success: true,
        timestamp: new Date().toISOString(),
        externalId: `github://${owner}/${repo}/issues/DRY_RUN`,
      },
    };
  }
  
  try {
    // Validate required options
    if (!owner || !repo) {
      throw new Error('GitHub owner and repo are required');
    }
    
    if (!token) {
      throw new Error('GitHub token is required for emission');
    }
    
    // Prepare issue data
    const issueData = {
      title: candidate.title,
      body: candidate.body,
      labels: candidate.metadata.labels || [],
      assignees: candidate.metadata.assignees || [],
    };
    
    // Make GitHub API call
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issueData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
    }
    
    const issue = await response.json() as { number: number; html_url: string };
    
    const result: EmissionResult = {
      success: true,
      timestamp: new Date().toISOString(),
      externalId: `github://${owner}/${repo}/issues/${issue.number}`,
    };
    
    console.log(`✓ Created GitHub issue #${issue.number}: ${issue.html_url}`);
    
    return {
      ...candidate,
      emitted: true,
      emissionResult: result,
    };
  } catch (error) {
    const result: EmissionResult = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    console.error(`✗ Failed to create GitHub issue: ${result.error}`);
    
    return {
      ...candidate,
      emitted: false,
      emissionResult: result,
    };
  }
}
