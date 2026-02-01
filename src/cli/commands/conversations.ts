/**
 * Praxis CLI - Conversations Commands
 * 
 * Commands for the praxis-conversations subsystem
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  loadConversation,
  captureConversation,
  redactConversation,
  normalizeConversation,
  classifyConversation,
  generateCandidate,
  applyGates,
  candidatePassed,
  emitToFS,
  emitToGitHub,
  type Conversation,
  type Candidate,
} from '../../conversations/index.js';

interface CaptureOptions {
  input?: string;
  output?: string;
}

interface PushOptions {
  input: string;
  output?: string;
  skipRedaction?: boolean;
  skipNormalization?: boolean;
}

interface ClassifyOptions {
  input: string;
  output?: string;
}

interface EmitOptions {
  input: string;
  emitter: 'fs' | 'github';
  outputDir?: string;
  owner?: string;
  repo?: string;
  token?: string;
  dryRun?: boolean;
  commitIntent?: boolean;
}

/**
 * Capture command: Capture a conversation from input
 */
export async function captureCommand(options: CaptureOptions): Promise<void> {
  console.log('📝 Capturing conversation...');
  
  let conversation: Conversation;
  
  if (options.input) {
    // Load from file
    const content = await fs.readFile(options.input, 'utf-8');
    conversation = loadConversation(content);
    console.log(`✓ Loaded conversation from ${options.input}`);
  } else {
    // Create a sample conversation for demo
    conversation = captureConversation({
      turns: [
        { role: 'user', content: 'Hello, I have a question about the feature' },
        { role: 'assistant', content: 'Sure, I\'d be happy to help!' },
      ],
      metadata: {
        source: 'cli',
      },
    });
    console.log('✓ Created sample conversation');
  }
  
  if (options.output) {
    await fs.writeFile(
      options.output,
      JSON.stringify(conversation, null, 2),
      'utf-8'
    );
    console.log(`✓ Saved to ${options.output}`);
  } else {
    console.log(JSON.stringify(conversation, null, 2));
  }
}

/**
 * Push command: Process conversation through pipeline (capture -> redact -> normalize)
 */
export async function pushCommand(options: PushOptions): Promise<void> {
  console.log('🔄 Processing conversation through pipeline...');
  
  // Load conversation
  const content = await fs.readFile(options.input, 'utf-8');
  let conversation = loadConversation(content);
  console.log(`✓ Loaded conversation ${conversation.id}`);
  
  // Redact
  if (!options.skipRedaction) {
    conversation = redactConversation(conversation);
    console.log('✓ Redacted PII');
  }
  
  // Normalize
  if (!options.skipNormalization) {
    conversation = normalizeConversation(conversation);
    console.log('✓ Normalized content');
  }
  
  // Save result
  if (options.output) {
    await fs.writeFile(
      options.output,
      JSON.stringify(conversation, null, 2),
      'utf-8'
    );
    console.log(`✓ Saved to ${options.output}`);
  } else {
    console.log(JSON.stringify(conversation, null, 2));
  }
}

/**
 * Classify command: Classify a conversation and generate candidate
 */
export async function classifyCommand(options: ClassifyOptions): Promise<void> {
  console.log('🏷️  Classifying conversation...');
  
  // Load conversation
  const content = await fs.readFile(options.input, 'utf-8');
  let conversation = loadConversation(content);
  console.log(`✓ Loaded conversation ${conversation.id}`);
  
  // Ensure conversation is processed
  if (!conversation.redacted) {
    conversation = redactConversation(conversation);
    console.log('✓ Applied redaction');
  }
  
  if (!conversation.normalized) {
    conversation = normalizeConversation(conversation);
    console.log('✓ Applied normalization');
  }
  
  // Classify
  conversation = classifyConversation(conversation);
  console.log(`✓ Classified as: ${conversation.classification?.category} (confidence: ${conversation.classification?.confidence?.toFixed(2)})`);
  
  // Generate candidate
  const candidate = generateCandidate(conversation);
  if (!candidate) {
    console.error('✗ Failed to generate candidate');
    process.exit(1);
  }
  
  console.log(`✓ Generated candidate: ${candidate.title}`);
  
  // Apply gates
  const gatedCandidate = applyGates(candidate);
  console.log(`\n📋 Gate Results:`);
  for (const gate of gatedCandidate.gateStatus?.gates || []) {
    const icon = gate.passed ? '✓' : '✗';
    console.log(`  ${icon} ${gate.name}: ${gate.message}`);
  }
  
  const passed = candidatePassed(gatedCandidate);
  console.log(`\n${passed ? '✓ All gates passed' : '✗ Some gates failed'}`);
  
  // Save result
  if (options.output) {
    await fs.writeFile(
      options.output,
      JSON.stringify(gatedCandidate, null, 2),
      'utf-8'
    );
    console.log(`✓ Saved candidate to ${options.output}`);
  } else {
    console.log('\n' + JSON.stringify(gatedCandidate, null, 2));
  }
}

/**
 * Emit command: Emit a candidate to a destination
 */
export async function emitCommand(options: EmitOptions): Promise<void> {
  console.log('📤 Emitting candidate...');
  
  // Load candidate
  const content = await fs.readFile(options.input, 'utf-8');
  const candidate = JSON.parse(content) as Candidate;
  console.log(`✓ Loaded candidate ${candidate.id}`);
  
  // Check gates
  if (!candidatePassed(candidate)) {
    console.error('✗ Candidate did not pass gates, refusing to emit');
    console.error(`  Reason: ${candidate.gateStatus?.reason}`);
    process.exit(1);
  }
  
  let result: Candidate;
  
  if (options.emitter === 'fs') {
    const outputDir = options.outputDir || './output/candidates';
    result = await emitToFS(candidate, {
      outputDir,
      dryRun: options.dryRun,
    });
    
    if (result.emissionResult?.success) {
      console.log(`✓ Emitted to filesystem: ${result.emissionResult.externalId}`);
    } else {
      console.error(`✗ Emission failed: ${result.emissionResult?.error}`);
      process.exit(1);
    }
  } else if (options.emitter === 'github') {
    if (!options.owner || !options.repo) {
      console.error('✗ GitHub emitter requires --owner and --repo');
      process.exit(1);
    }
    
    // CRITICAL: Display commit_intent gate status
    if (!options.commitIntent) {
      console.error('');
      console.error('⛔ GATE BLOCKED: commit_intent=false');
      console.error('');
      console.error('The GitHub emitter is HARD GATED by the --commit-intent flag.');
      console.error('This prevents accidental issue creation.');
      console.error('');
      console.error('To emit to GitHub, add: --commit-intent');
      console.error('');
      process.exit(1);
    }
    
    result = await emitToGitHub(candidate, {
      owner: options.owner,
      repo: options.repo,
      token: options.token,
      dryRun: options.dryRun,
      commitIntent: options.commitIntent,
    });
    
    if (result.emissionResult?.success) {
      console.log(`✓ Emitted to GitHub: ${result.emissionResult.externalId}`);
    } else {
      console.error(`✗ Emission failed: ${result.emissionResult?.error}`);
      process.exit(1);
    }
  }
}
