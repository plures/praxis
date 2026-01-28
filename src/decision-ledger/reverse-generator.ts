/**
 * Decision Ledger - Reverse Contract Generator
 *
 * Generates contracts from existing code using AI (GitHub Copilot/OpenAI) or
 * non-AI heuristic approaches.
 */

import type { Contract, Example, Assumption, Reference } from './types.js';
import type { RuleDescriptor, ConstraintDescriptor } from '../core/rules.js';
import { defineContract } from './types.js';
import { inferContractFromFile } from './scanner.js';

/**
 * AI provider for contract generation.
 */
export type AIProvider = 'none' | 'github-copilot' | 'openai' | 'auto';

/**
 * Options for reverse contract generation.
 */
export interface ReverseGenerationOptions {
  /** AI provider to use */
  aiProvider?: AIProvider;
  /** OpenAI API key (if using OpenAI) */
  openaiApiKey?: string;
  /** GitHub token (if using GitHub Copilot) */
  githubToken?: string;
  /** Confidence threshold for AI-generated content (0.0 to 1.0) */
  confidenceThreshold?: number;
  /** Whether to include assumptions */
  includeAssumptions?: boolean;
  /** Whether to generate examples from tests */
  generateExamples?: boolean;
  /** Source file path for the rule/constraint */
  sourceFile?: string;
  /** Test file paths associated with the rule */
  testFiles?: string[];
  /** Spec file paths associated with the rule */
  specFiles?: string[];
}

/**
 * Result of reverse contract generation.
 */
export interface GenerationResult {
  /** Generated contract */
  contract: Contract;
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  /** Method used for generation */
  method: 'ai' | 'heuristic' | 'hybrid';
  /** Warnings or issues encountered */
  warnings: string[];
}

/**
 * Generate a contract from an existing rule or constraint.
 *
 * @param descriptor The rule or constraint descriptor
 * @param options Generation options
 * @returns Generation result
 */
export async function generateContractFromRule(
  descriptor: RuleDescriptor | ConstraintDescriptor,
  options: ReverseGenerationOptions = {}
): Promise<GenerationResult> {
  const {
    aiProvider = 'none',
    confidenceThreshold = 0.7,
    includeAssumptions = true,
    generateExamples = true,
    sourceFile,
    testFiles = [],
    specFiles = [],
  } = options;

  const warnings: string[] = [];

  // Attempt AI-powered generation first
  if (aiProvider !== 'none') {
    try {
      const aiResult = await generateWithAI(descriptor, options);
      if (aiResult.confidence >= confidenceThreshold) {
        return aiResult;
      }
      warnings.push(
        `AI confidence ${aiResult.confidence} below threshold ${confidenceThreshold}, falling back to heuristic`
      );
    } catch (error) {
      warnings.push(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Fallback to heuristic generation
  const heuristicResult = await generateWithHeuristics(
    descriptor,
    { sourceFile, testFiles, specFiles, includeAssumptions, generateExamples }
  );

  return {
    ...heuristicResult,
    warnings: [...warnings, ...heuristicResult.warnings],
  };
}

/**
 * Generate contract using AI.
 */
async function generateWithAI(
  descriptor: RuleDescriptor | ConstraintDescriptor,
  options: ReverseGenerationOptions
): Promise<GenerationResult> {
  const { aiProvider, openaiApiKey, githubToken } = options;

  if (aiProvider === 'openai') {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for OpenAI provider');
    }
    return await generateWithOpenAI(descriptor, openaiApiKey, options);
  }

  if (aiProvider === 'github-copilot') {
    if (!githubToken) {
      throw new Error('GitHub token is required for GitHub Copilot provider');
    }
    return await generateWithGitHubCopilot(descriptor, githubToken, options);
  }

  if (aiProvider === 'auto') {
    // Try GitHub Copilot first, then OpenAI
    if (githubToken) {
      return await generateWithGitHubCopilot(descriptor, githubToken, options);
    }
    if (openaiApiKey) {
      return await generateWithOpenAI(descriptor, openaiApiKey, options);
    }
    throw new Error('Auto AI provider requires either GitHub token or OpenAI API key');
  }

  throw new Error(`Unsupported AI provider: ${aiProvider}`);
}

/**
 * Generate contract using OpenAI.
 */
async function generateWithOpenAI(
  descriptor: RuleDescriptor | ConstraintDescriptor,
  _apiKey: string,
  options: ReverseGenerationOptions
): Promise<GenerationResult> {
  // Build prompt for OpenAI
  // const prompt = buildPromptForContract(descriptor, options);

  // In a real implementation, this would call the OpenAI API
  // For now, we'll return a placeholder indicating AI would be used
  // const warnings: string[] = [
  //   'OpenAI integration is a placeholder - implement with actual API calls',
  // ];

  // Fallback to heuristic for now
  return await generateWithHeuristics(descriptor, {
    sourceFile: options.sourceFile,
    testFiles: options.testFiles,
    specFiles: options.specFiles,
    includeAssumptions: options.includeAssumptions,
    generateExamples: options.generateExamples,
  });
}

/**
 * Generate contract using GitHub Copilot.
 */
async function generateWithGitHubCopilot(
  descriptor: RuleDescriptor | ConstraintDescriptor,
  _token: string,
  options: ReverseGenerationOptions
): Promise<GenerationResult> {
  // Build prompt for GitHub Copilot
  // const prompt = buildPromptForContract(descriptor, options);

  // In a real implementation, this would call the GitHub Copilot API
  // For now, we'll return a placeholder indicating AI would be used
  // const warnings: string[] = [
  //   'GitHub Copilot integration is a placeholder - implement with actual API calls',
  // ];

  // Fallback to heuristic for now
  return await generateWithHeuristics(descriptor, {
    sourceFile: options.sourceFile,
    testFiles: options.testFiles,
    specFiles: options.specFiles,
    includeAssumptions: options.includeAssumptions,
    generateExamples: options.generateExamples,
  });
}

/**
 * Generate contract using heuristic analysis.
 */
async function generateWithHeuristics(
  descriptor: RuleDescriptor | ConstraintDescriptor,
  options: {
    sourceFile?: string;
    testFiles?: string[];
    specFiles?: string[];
    includeAssumptions?: boolean;
    generateExamples?: boolean;
  }
): Promise<GenerationResult> {
  const warnings: string[] = [];
  const { sourceFile, testFiles = [], specFiles = [] } = options;

  // Start with basic information
  let behavior = descriptor.description || `Process ${descriptor.id}`;
  let examples: Example[] = [];
  let invariants: string[] = [];
  let assumptions: Assumption[] = [];
  let references: Reference[] = [];

  // Infer from source file if available
  if (sourceFile) {
    try {
      const inferred = await inferContractFromFile(sourceFile, descriptor.id);
      if (inferred.behavior) {
        behavior = inferred.behavior;
      }
      if (inferred.invariants && inferred.invariants.length > 0) {
        invariants = inferred.invariants;
      }
    } catch (error) {
      warnings.push(`Failed to analyze source file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Extract examples from test files
  if (options.generateExamples && testFiles.length > 0) {
    for (const testFile of testFiles) {
      try {
        const testExamples = await extractExamplesFromTests(testFile, descriptor.id);
        examples.push(...testExamples);
      } catch (error) {
        warnings.push(`Failed to extract examples from ${testFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // If no examples found, create a default one
  if (examples.length === 0) {
    examples.push({
      given: `System is in a valid state`,
      when: `${descriptor.id} is triggered`,
      then: `Expected outcome is produced`,
    });
    warnings.push('No test files found - using default example');
  }

  // Add references to spec files
  if (specFiles.length > 0) {
    references = specFiles.map((file) => ({
      type: 'spec',
      url: file,
      description: `Specification for ${descriptor.id}`,
    }));
  }

  // Generate assumptions if requested
  if (options.includeAssumptions) {
    assumptions = generateDefaultAssumptions(descriptor);
  }

  // Create the contract
  const contract = defineContract({
    ruleId: descriptor.id,
    behavior,
    examples,
    invariants: invariants.length > 0 ? invariants : [`${descriptor.id} maintains system invariants`],
    assumptions,
    references,
  });

  // Calculate confidence based on what we found
  let confidence = 0.5; // Base confidence for heuristic
  if (sourceFile) confidence += 0.1;
  if (testFiles.length > 0) confidence += 0.2;
  if (specFiles.length > 0) confidence += 0.1;
  if (examples.length > 1) confidence += 0.1;

  return {
    contract,
    confidence: Math.min(confidence, 0.9), // Cap at 0.9 for heuristic
    method: 'heuristic',
    warnings,
  };
}

/**
 * Extract examples from test files.
 */
async function extractExamplesFromTests(
  testFile: string,
  _ruleId: string
): Promise<Example[]> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(testFile, 'utf-8');
  const examples: Example[] = [];

  // Look for test descriptions that might indicate Given/When/Then
  const testPattern = /(?:it|test)\s*\(\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = testPattern.exec(content)) !== null) {
    const description = match[1];
    
    // Try to parse as Given/When/Then
    if (description.includes('when') || description.includes('should')) {
      examples.push(parseTestDescription(description));
    }
  }

  return examples;
}

/**
 * Parse a test description into a Given/When/Then example.
 */
function parseTestDescription(description: string): Example {
  // Simple heuristic parsing
  const parts = description.split(/when|should/i);
  
  if (parts.length >= 2) {
    return {
      given: parts[0].trim() || 'Initial state',
      when: parts.length > 2 ? parts[1].trim() : 'Action is triggered',
      then: parts[parts.length - 1].trim() || 'Expected outcome occurs',
    };
  }

  return {
    given: description,
    when: 'Action is triggered',
    then: 'Expected outcome occurs',
  };
}

/**
 * Generate default assumptions for a rule.
 */
function generateDefaultAssumptions(
  descriptor: RuleDescriptor | ConstraintDescriptor
): Assumption[] {
  return [
    {
      id: `${descriptor.id}-assumption-1`,
      statement: 'Input data is valid and well-formed',
      confidence: 0.8,
      justification: 'Standard assumption for rule processing',
      impacts: ['tests', 'code'],
      status: 'active',
    },
    {
      id: `${descriptor.id}-assumption-2`,
      statement: 'System state is consistent before rule execution',
      confidence: 0.7,
      justification: 'Required for deterministic rule behavior',
      impacts: ['spec', 'tests'],
      status: 'active',
    },
  ];
}

/**
 * Build a prompt for AI contract generation.
 * Currently unused but kept for future AI integration.
 * @internal
 */
export function buildPromptForContract(
  descriptor: RuleDescriptor | ConstraintDescriptor,
  options: ReverseGenerationOptions
): string {
  const parts: string[] = [
    'Generate a comprehensive contract for the following rule/constraint:',
    '',
    `ID: ${descriptor.id}`,
    `Description: ${descriptor.description}`,
    '',
    'The contract should include:',
    '1. A clear canonical behavior description',
    '2. At least 2-3 Given/When/Then examples',
    '3. Key invariants that must hold',
    '4. Assumptions with confidence levels',
    '',
  ];

  if (options.testFiles && options.testFiles.length > 0) {
    parts.push('Test files available:');
    options.testFiles.forEach((file) => parts.push(`- ${file}`));
    parts.push('');
  }

  if (options.specFiles && options.specFiles.length > 0) {
    parts.push('Specification files available:');
    options.specFiles.forEach((file) => parts.push(`- ${file}`));
    parts.push('');
  }

  parts.push('Return the contract as a JSON object matching the Contract interface.');

  return parts.join('\n');
}
