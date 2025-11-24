/**
 * Praxis Schema Loader
 * 
 * Loads and validates Praxis schema files.
 */

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { load as yamlLoad } from 'js-yaml';
import type { PraxisSchema, ValidationResult } from './types.js';
import { validateSchema } from './types.js';

/**
 * Loader options
 */
export interface LoaderOptions {
  /** Validate schema after loading */
  validate?: boolean;
  /** Base directory for resolving relative paths */
  baseDir?: string;
}

/**
 * Loader result
 */
export interface LoaderResult {
  /** Loaded schema */
  schema?: PraxisSchema;
  /** Validation result */
  validation?: ValidationResult;
  /** Load errors */
  errors: string[];
}

/**
 * Load a Praxis schema from a file
 */
export async function loadSchema(
  filePath: string,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  const errors: string[] = [];
  
  try {
    // Only .js files are supported. TypeScript schema files must be compiled to .js first.
    // Use a compiled JavaScript file for your schema.
    // Dynamic import is used, which works with .js files only.
    
    // Convert to absolute URL for ES module import
    let fileUrl = pathToFileURL(filePath).href;
    
    // Attempt to import .ts or .js files directly. If import fails, error will be caught below.
    
    // Dynamic import of the schema file
    const module = await import(fileUrl);
    
    // Look for common schema export names
    let schema: PraxisSchema | undefined;
    if (module.default) {
      schema = module.default;
    } else if (module.schema) {
      schema = module.schema;
    } else if (module.appSchema) {
      schema = module.appSchema;
    } else {
      // Try to find any object that looks like a PraxisSchema
      const exports = Object.values(module);
      const possibleSchema = exports.find(
        (exp): exp is PraxisSchema =>
          typeof exp === 'object' &&
          exp !== null &&
          'version' in exp &&
          'name' in exp
      );
      if (possibleSchema) {
        schema = possibleSchema;
      }
    }
    
    if (!schema) {
      errors.push(
        'Schema file must export a PraxisSchema object (as default, schema, or appSchema)'
      );
      return { errors };
    }
    
    // Validate if requested
    let validation: ValidationResult | undefined;
    if (options.validate !== false) {
      validation = validateSchema(schema);
      if (!validation.valid) {
        errors.push('Schema validation failed:');
        validation.errors.forEach((error) => {
          errors.push(`  ${error.path}: ${error.message}`);
        });
      }
    }
    
    return {
      schema,
      validation,
      errors,
    };
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Failed to load schema: ${error.message}`);
    } else {
      errors.push('Failed to load schema: Unknown error');
    }
    return { errors };
  }
}

/**
 * Load schema from JSON string
 */
export function loadSchemaFromJson(
  json: string,
  options: LoaderOptions = {}
): LoaderResult {
  const errors: string[] = [];
  
  try {
    const schema = JSON.parse(json) as PraxisSchema;
    
    // Validate if requested
    let validation: ValidationResult | undefined;
    if (options.validate !== false) {
      validation = validateSchema(schema);
      if (!validation.valid) {
        errors.push('Schema validation failed:');
        validation.errors.forEach((error) => {
          errors.push(`  ${error.path}: ${error.message}`);
        });
      }
    }
    
    return {
      schema,
      validation,
      errors,
    };
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Failed to parse JSON: ${error.message}`);
    } else {
      errors.push('Failed to parse JSON: Unknown error');
    }
    return { errors };
  }
}

/**
 * Load schema from YAML string
 */
export function loadSchemaFromYaml(
  yaml: string,
  options: LoaderOptions = {}
): LoaderResult {
  const errors: string[] = [];
  
  try {
    const schema = yamlLoad(yaml) as PraxisSchema;
    
    // Validate if requested
    let validation: ValidationResult | undefined;
    if (options.validate !== false) {
      validation = validateSchema(schema);
      if (!validation.valid) {
        errors.push('Schema validation failed:');
        validation.errors.forEach((error) => {
          errors.push(`  ${error.path}: ${error.message}`);
        });
      }
    }
    
    return {
      schema,
      validation,
      errors,
    };
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Failed to parse YAML: ${error.message}`);
    } else {
      errors.push('Failed to parse YAML: Unknown error');
    }
    return { errors };
  }
}

/**
 * Load schema from file (supports .ts, .json, and .yaml/.yml)
 */
export async function loadSchemaFromFile(
  filePath: string,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  if (filePath.endsWith('.json')) {
    const content = await readFile(filePath, 'utf-8');
    return loadSchemaFromJson(content, options);
  } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    const content = await readFile(filePath, 'utf-8');
    return loadSchemaFromYaml(content, options);
  } else {
    return loadSchema(filePath, options);
  }
}

/**
 * Validate that a loaded schema has required fields for generation
 */
export function validateForGeneration(schema: PraxisSchema): ValidationResult {
  const errors: string[] = [];
  
  // Check for entities/models
  if (!schema.models || schema.models.length === 0) {
    errors.push('Schema must define at least one model for generation');
  }
  
  // Check that models have valid fields
  schema.models?.forEach((model, index) => {
    if (!model.fields || model.fields.length === 0) {
      errors.push(
        `Model "${model.name}" at index ${index} must have at least one field`
      );
    }
    
    model.fields?.forEach((field, fieldIndex) => {
      if (!field.name) {
        errors.push(
          `Field at index ${fieldIndex} in model "${model.name}" must have a name`
        );
      }
      if (!field.type) {
        errors.push(
          `Field "${field.name}" in model "${model.name}" must have a type`
        );
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors: errors.map((message) => ({ path: 'schema', message })),
  };
}
