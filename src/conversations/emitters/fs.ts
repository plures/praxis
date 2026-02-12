/**
 * Filesystem emitter for praxis-conversations
 * Emits candidates to the local filesystem
 */

import type { Candidate, FSEmitterOptions, EmissionResult } from '../types.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Emit a candidate to the filesystem
 */
export async function emitToFS(
  candidate: Candidate,
  options: FSEmitterOptions
): Promise<Candidate> {
  const { outputDir, dryRun = false } = options;
  
  if (dryRun) {
    console.log(`[DRY RUN] Would emit candidate ${candidate.id} to ${outputDir}`);
    return {
      ...candidate,
      emitted: true,
      emissionResult: {
        success: true,
        timestamp: new Date().toISOString(),
        externalId: `fs://${outputDir}/${candidate.id}.json`,
      },
    };
  }
  
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write candidate to file
    const filename = `${candidate.id}.json`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(candidate, null, 2), 'utf-8');
    
    const result: EmissionResult = {
      success: true,
      timestamp: new Date().toISOString(),
      externalId: `fs://${filepath}`,
    };
    
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
    
    return {
      ...candidate,
      emitted: false,
      emissionResult: result,
    };
  }
}
