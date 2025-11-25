/**
 * Praxis Svelte Generator
 * 
 * Generates Svelte components from PSF schema definitions.
 * Provides a complete UI generation pipeline from schema to components.
 */

// Re-export existing component generator
export {
  ComponentGenerator,
  createComponentGenerator,
  type GeneratorConfig,
  type GenerationResult,
  type GeneratedFile,
  type GenerationError,
} from '../../src/core/component/generator.js';

// Export PSF-aware generator
export * from './psf-generator.js';
