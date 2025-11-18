/**
 * PluresDB Config Generator
 * 
 * Generates PluresDB configuration from schema definitions.
 */

import type { NormalizedSchema, NormalizedModel } from '../schema/normalize.js';

/**
 * PluresDB config generation options
 */
export interface PluresDBGeneratorOptions {
  /** Output directory */
  outputDir: string;
  /** Database name */
  dbName?: string;
  /** Database version */
  dbVersion?: number;
  /** Enable sync */
  enableSync?: boolean;
  /** Sync endpoint */
  syncEndpoint?: string;
}

/**
 * Generated PluresDB config file
 */
export interface GeneratedPluresDBFile {
  /** File path */
  path: string;
  /** File content */
  content: string;
  /** File type */
  type: 'config' | 'types';
}

/**
 * PluresDB store definition
 */
interface StoreDefinition {
  keyPath: string;
  indexes: string[];
}

/**
 * PluresDB generator class
 */
export class PluresDBGenerator {
  private options: PluresDBGeneratorOptions;
  
  constructor(options: PluresDBGeneratorOptions) {
    this.options = {
      dbVersion: 1,
      enableSync: false,
      ...options,
    };
  }
  
  /**
   * Generate PluresDB configuration from schema
   */
  generateConfig(schema: NormalizedSchema): GeneratedPluresDBFile[] {
    const files: GeneratedPluresDBFile[] = [];
    
    // Generate the main config file
    files.push(this.generateConfigFile(schema));
    
    return files;
  }
  
  /**
   * Generate pluresdb-config.ts file
   */
  private generateConfigFile(schema: NormalizedSchema): GeneratedPluresDBFile {
    const lines: string[] = [];
    const dbName = this.options.dbName || schema.name.toLowerCase();
    
    lines.push('/**');
    lines.push(` * PluresDB Configuration for ${schema.name}`);
    lines.push(' * Generated from Praxis schema');
    lines.push(' */');
    lines.push('');
    
    // Import statement (for future PluresDB integration)
    lines.push('// import { createPluresDB } from \'@plures/pluresdb\';');
    lines.push('');
    
    // Generate store definitions
    lines.push('/**');
    lines.push(' * Database store configuration');
    lines.push(' */');
    lines.push('export const stores = {');
    
    if (schema.models && schema.models.length > 0) {
      for (const model of schema.models) {
        const storeName = model.name.toLowerCase() + 's';
        const storeConfig = this.generateStoreConfig(model);
        
        lines.push(`  ${storeName}: {`);
        lines.push(`    keyPath: '${storeConfig.keyPath}',`);
        
        if (storeConfig.indexes.length > 0) {
          lines.push(`    indexes: [${storeConfig.indexes.map(idx => `'${idx}'`).join(', ')}],`);
        }
        
        lines.push('  },');
      }
    } else {
      lines.push('  // No models defined in schema');
    }
    
    lines.push('};');
    lines.push('');
    
    // Generate main config
    lines.push('/**');
    lines.push(' * Database configuration');
    lines.push(' */');
    lines.push('export const dbConfig = {');
    lines.push(`  name: '${dbName}',`);
    lines.push(`  version: ${this.options.dbVersion},`);
    lines.push('  stores,');
    
    if (this.options.enableSync) {
      lines.push('  sync: {');
      lines.push('    enabled: true,');
      
      if (this.options.syncEndpoint) {
        lines.push(`    endpoint: '${this.options.syncEndpoint}',`);
      } else {
        lines.push('    endpoint: \'ws://localhost:8080/sync\',');
      }
      
      lines.push('    conflictResolution: \'last-write-wins\',');
      lines.push('  },');
    }
    
    lines.push('};');
    lines.push('');
    
    // Generate initialization function
    lines.push('/**');
    lines.push(' * Initialize PluresDB');
    lines.push(' */');
    lines.push('export function initDB() {');
    lines.push('  // TODO: Implement PluresDB initialization');
    lines.push('  // return createPluresDB(dbConfig);');
    lines.push('  console.log(\'PluresDB config ready:\', dbConfig);');
    lines.push('  return null;');
    lines.push('}');
    
    return {
      path: `${this.options.outputDir}/pluresdb-config.ts`,
      content: lines.join('\n'),
      type: 'config',
    };
  }
  
  /**
   * Generate store configuration for a model
   */
  private generateStoreConfig(model: NormalizedModel): StoreDefinition {
    // Find the ID field (or use 'id' as default)
    const idField = model.fields.find(f => f.name === 'id' || f.name === '_id');
    const keyPath = idField ? idField.name : 'id';
    
    // Generate indexes from field names (excluding the key path)
    // Note: By default, all string, number, and date fields are indexed for query performance.
    // This auto-indexing can be overridden by explicitly defining indexes in the schema.
    // For large datasets, consider only indexing fields that will be frequently queried.
    const indexes: string[] = [];
    
    for (const field of model.fields) {
      if (field.name !== keyPath) {
        // Add indexed fields
        if (field.type === 'string' || field.type === 'number' || field.type === 'date') {
          indexes.push(field.name);
        }
      }
    }
    
    // Add indexes from schema index definitions
    if (model.indexes) {
      for (const indexDef of model.indexes) {
        for (const fieldName of indexDef.fields) {
          if (!indexes.includes(fieldName) && fieldName !== keyPath) {
            indexes.push(fieldName);
          }
        }
      }
    }
    
    return {
      keyPath,
      indexes,
    };
  }
}

/**
 * Create a PluresDB generator
 */
export function createPluresDBGenerator(
  outputDir: string,
  options?: Partial<PluresDBGeneratorOptions>
): PluresDBGenerator {
  return new PluresDBGenerator({
    outputDir,
    ...options,
  });
}
