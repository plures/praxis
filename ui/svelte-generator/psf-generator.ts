/**
 * PSF-Aware Svelte Generator
 * 
 * Generates Svelte components directly from PSF schema.
 */

import type { PSFSchema, PSFComponent, PSFModel, PSFFieldType } from '../../core/schema-engine/psf.js';

/**
 * Generated Svelte component
 */
export interface GeneratedSvelteComponent {
  /** Component name */
  name: string;
  /** Svelte file content */
  svelte: string;
  /** TypeScript types */
  types?: string;
  /** Test file */
  test?: string;
  /** Documentation */
  docs?: string;
}

/**
 * Svelte generator options
 */
export interface SvelteGeneratorOptions {
  /** Include TypeScript types */
  typescript?: boolean;
  /** Include tests */
  includeTests?: boolean;
  /** Include documentation */
  includeDocs?: boolean;
  /** Component style (Svelte 4 runes, Svelte 5 runes) */
  svelteVersion?: 4 | 5;
  /** CSS framework */
  cssFramework?: 'none' | 'tailwind' | 'pico';
}

/**
 * PSF Svelte Generator
 */
export class PSFSvelteGenerator {
  private options: Required<SvelteGeneratorOptions>;

  constructor(options: SvelteGeneratorOptions = {}) {
    this.options = {
      typescript: options.typescript ?? true,
      includeTests: options.includeTests ?? false,
      includeDocs: options.includeDocs ?? false,
      svelteVersion: options.svelteVersion ?? 5,
      cssFramework: options.cssFramework ?? 'none',
    };
  }

  /**
   * Generate all components from schema
   */
  generateFromSchema(schema: PSFSchema): GeneratedSvelteComponent[] {
    const components: GeneratedSvelteComponent[] = [];

    // Generate components defined in schema
    for (const comp of schema.components) {
      const model = comp.model
        ? schema.models.find((m) => m.name === comp.model)
        : undefined;
      components.push(this.generateComponent(comp, model));
    }

    // Generate model-based components for models without explicit components
    for (const model of schema.models) {
      const hasComponent = schema.components.some((c) => c.model === model.name);
      if (!hasComponent) {
        // Generate default form and display components
        components.push(this.generateModelForm(model));
        components.push(this.generateModelDisplay(model));
      }
    }

    return components;
  }

  /**
   * Generate a single component
   */
  generateComponent(comp: PSFComponent, model?: PSFModel): GeneratedSvelteComponent {
    const svelte = this.generateSvelteFile(comp, model);
    const types = this.options.typescript ? this.generateTypesFile(comp, model) : undefined;
    const test = this.options.includeTests ? this.generateTestFile(comp) : undefined;
    const docs = this.options.includeDocs ? this.generateDocsFile(comp, model) : undefined;

    return {
      name: comp.name,
      svelte,
      types,
      test,
      docs,
    };
  }

  /**
   * Generate Svelte file content
   */
  private generateSvelteFile(comp: PSFComponent, model?: PSFModel): string {
    const lines: string[] = [];

    // Script section
    lines.push(`<script${this.options.typescript ? ' lang="ts"' : ''}>`);
    lines.push(this.generateScript(comp, model));
    lines.push('</script>');
    lines.push('');

    // Template section
    lines.push(this.generateTemplate(comp, model));
    lines.push('');

    // Style section
    const styles = this.generateStyles(comp);
    if (styles) {
      lines.push('<style>');
      lines.push(styles);
      lines.push('</style>');
    }

    return lines.join('\n');
  }

  /**
   * Generate script section
   */
  private generateScript(comp: PSFComponent, model?: PSFModel): string {
    const lines: string[] = [];
    const useSvelte5 = this.options.svelteVersion === 5;

    // Imports
    lines.push(`  import { createEventDispatcher } from 'svelte';`);
    if (model) {
      lines.push(`  import type { ${model.name} } from './types.js';`);
    }
    lines.push('');

    // Props
    if (useSvelte5) {
      // Svelte 5 runes
      lines.push('  // Props');
      for (const prop of comp.props) {
        const typeAnnotation = this.options.typescript ? `: ${prop.type}` : '';
        const defaultValue = prop.default !== undefined ? ` = ${JSON.stringify(prop.default)}` : '';
        lines.push(`  let { ${prop.name}${typeAnnotation}${defaultValue} } = $props();`);
      }
    } else {
      // Svelte 4
      for (const prop of comp.props) {
        const typeAnnotation = this.options.typescript ? `: ${prop.type}` : '';
        const defaultValue = prop.default !== undefined ? ` = ${JSON.stringify(prop.default)}` : '';
        lines.push(`  export let ${prop.name}${typeAnnotation}${defaultValue};`);
      }
    }
    lines.push('');

    // Event dispatcher
    lines.push('  const dispatch = createEventDispatcher();');
    lines.push('');

    // Component-specific logic
    switch (comp.type) {
      case 'form':
        lines.push('  // Form state');
        if (model) {
          lines.push(`  let formData = ${useSvelte5 ? '$state' : ''}({`);
          for (const field of model.fields) {
            const defaultVal = this.getDefaultValue(field.type);
            lines.push(`    ${field.name}: ${defaultVal},`);
          }
          lines.push('  });');
        } else {
          lines.push(`  let formData = ${useSvelte5 ? '$state({})' : '{}'};`);
        }
        lines.push('');
        lines.push('  function handleSubmit(event: SubmitEvent) {');
        lines.push('    event.preventDefault();');
        lines.push("    dispatch('submit', formData);");
        lines.push('  }');
        break;

      case 'list':
        lines.push('  // List handling');
        lines.push(`  export let items${this.options.typescript ? `: ${model?.name || 'unknown'}[]` : ''} = [];`);
        lines.push('');
        lines.push(`  function handleSelect(item${this.options.typescript ? `: ${model?.name || 'unknown'}` : ''}) {`);
        lines.push("    dispatch('select', item);");
        lines.push('  }');
        break;

      case 'display':
        lines.push('  // Display formatting');
        if (model) {
          lines.push(`  export let data${this.options.typescript ? `: ${model.name}` : ''};`);
        }
        break;

      default:
        lines.push('  // Component logic');
    }

    return lines.join('\n');
  }

  /**
   * Generate template section
   */
  private generateTemplate(comp: PSFComponent, model?: PSFModel): string {
    switch (comp.type) {
      case 'form':
        return this.generateFormTemplate(comp, model);
      case 'display':
        return this.generateDisplayTemplate(comp, model);
      case 'list':
        return this.generateListTemplate(comp, model);
      case 'navigation':
        return this.generateNavigationTemplate(comp);
      default:
        return `<div class="${this.toKebabCase(comp.name)}">\n  <!-- ${comp.name} -->\n</div>`;
    }
  }

  /**
   * Generate form template
   */
  private generateFormTemplate(comp: PSFComponent, model?: PSFModel): string {
    const lines: string[] = [];
    const className = this.toKebabCase(comp.name);

    lines.push(`<form class="${className}" on:submit={handleSubmit}>`);

    if (model) {
      for (const field of model.fields) {
        const inputType = this.getInputType(field.type);
        const label = field.description || this.toTitleCase(field.name);

        lines.push(`  <div class="field">`);
        lines.push(`    <label for="${field.name}">${label}</label>`);

        if (inputType === 'textarea') {
          lines.push(`    <textarea id="${field.name}" bind:value={formData.${field.name}}></textarea>`);
        } else if (inputType === 'checkbox') {
          lines.push(`    <input type="checkbox" id="${field.name}" bind:checked={formData.${field.name}} />`);
        } else {
          lines.push(`    <input type="${inputType}" id="${field.name}" bind:value={formData.${field.name}} />`);
        }

        lines.push(`  </div>`);
      }
    }

    lines.push(`  <button type="submit">Submit</button>`);
    lines.push(`</form>`);

    return lines.join('\n');
  }

  /**
   * Generate display template
   */
  private generateDisplayTemplate(comp: PSFComponent, model?: PSFModel): string {
    const lines: string[] = [];
    const className = this.toKebabCase(comp.name);

    lines.push(`<div class="${className}">`);

    if (model) {
      lines.push(`  {#if data}`);
      for (const field of model.fields) {
        const label = field.description || this.toTitleCase(field.name);
        lines.push(`    <div class="field">`);
        lines.push(`      <strong>${label}:</strong> {data.${field.name}}`);
        lines.push(`    </div>`);
      }
      lines.push(`  {:else}`);
      lines.push(`    <p>No data</p>`);
      lines.push(`  {/if}`);
    } else {
      lines.push(`  <slot></slot>`);
    }

    lines.push(`</div>`);

    return lines.join('\n');
  }

  /**
   * Generate list template
   */
  private generateListTemplate(comp: PSFComponent, model?: PSFModel): string {
    const lines: string[] = [];
    const className = this.toKebabCase(comp.name);

    lines.push(`<div class="${className}">`);
    lines.push(`  {#if items.length > 0}`);
    lines.push(`    <ul>`);
    lines.push(`      {#each items as item}`);
    lines.push(`        <li>`);
    lines.push(`          <button on:click={() => handleSelect(item)}>`);

    if (model && model.fields.length > 0) {
      const displayField = model.fields.find((f) => f.name === 'name' || f.name === 'title') || model.fields[0];
      lines.push(`            {item.${displayField.name}}`);
    } else {
      lines.push(`            {item}`);
    }

    lines.push(`          </button>`);
    lines.push(`        </li>`);
    lines.push(`      {/each}`);
    lines.push(`    </ul>`);
    lines.push(`  {:else}`);
    lines.push(`    <p>No items</p>`);
    lines.push(`  {/if}`);
    lines.push(`</div>`);

    return lines.join('\n');
  }

  /**
   * Generate navigation template
   */
  private generateNavigationTemplate(comp: PSFComponent): string {
    const lines: string[] = [];
    const className = this.toKebabCase(comp.name);

    lines.push(`<nav class="${className}">`);
    lines.push(`  <ul>`);
    lines.push(`    <li><a href="/">Home</a></li>`);
    lines.push(`    <slot></slot>`);
    lines.push(`  </ul>`);
    lines.push(`</nav>`);

    return lines.join('\n');
  }

  /**
   * Generate styles
   */
  private generateStyles(comp: PSFComponent): string {
    const lines: string[] = [];
    const className = this.toKebabCase(comp.name);

    lines.push(`  .${className} {`);
    lines.push(`    /* Component styles */`);
    lines.push(`  }`);

    if (comp.type === 'form') {
      lines.push('');
      lines.push(`  .field {`);
      lines.push(`    margin-bottom: 1rem;`);
      lines.push(`  }`);
      lines.push('');
      lines.push(`  label {`);
      lines.push(`    display: block;`);
      lines.push(`    margin-bottom: 0.25rem;`);
      lines.push(`  }`);
    }

    return lines.join('\n');
  }

  /**
   * Generate model form component
   */
  private generateModelForm(model: PSFModel): GeneratedSvelteComponent {
    const comp: PSFComponent = {
      id: `form_${model.id}`,
      name: `${model.name}Form`,
      type: 'form',
      description: `Form for ${model.name}`,
      model: model.name,
      props: [],
      events: [{ name: 'submit', payload: model.name }],
    };

    return this.generateComponent(comp, model);
  }

  /**
   * Generate model display component
   */
  private generateModelDisplay(model: PSFModel): GeneratedSvelteComponent {
    const comp: PSFComponent = {
      id: `display_${model.id}`,
      name: `${model.name}Display`,
      type: 'display',
      description: `Display for ${model.name}`,
      model: model.name,
      props: [{ name: 'data', type: model.name, required: true }],
      events: [],
    };

    return this.generateComponent(comp, model);
  }

  /**
   * Generate types file
   */
  private generateTypesFile(comp: PSFComponent, model?: PSFModel): string {
    const lines: string[] = [];

    // Component props interface
    if (comp.props.length > 0) {
      lines.push(`export interface ${comp.name}Props {`);
      for (const prop of comp.props) {
        const optional = prop.required ? '' : '?';
        lines.push(`  ${prop.name}${optional}: ${prop.type};`);
      }
      lines.push(`}`);
      lines.push('');
    }

    // Model interface
    if (model) {
      lines.push(`export interface ${model.name} {`);
      for (const field of model.fields) {
        const optional = field.optional ? '?' : '';
        const type = this.fieldTypeToTS(field.type);
        lines.push(`  ${field.name}${optional}: ${type};`);
      }
      lines.push(`}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate test file
   */
  private generateTestFile(comp: PSFComponent): string {
    return `import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ${comp.name} from './${comp.name}.svelte';

describe('${comp.name}', () => {
  it('renders correctly', () => {
    const { container } = render(${comp.name});
    expect(container).toBeTruthy();
  });
});
`;
  }

  /**
   * Generate documentation file
   */
  private generateDocsFile(comp: PSFComponent, _model?: PSFModel): string {
    const lines: string[] = [];

    lines.push(`# ${comp.name}`);
    lines.push('');
    if (comp.description) {
      lines.push(comp.description);
      lines.push('');
    }

    lines.push('## Props');
    lines.push('');
    if (comp.props.length > 0) {
      lines.push('| Name | Type | Required | Description |');
      lines.push('| ---- | ---- | -------- | ----------- |');
      for (const prop of comp.props) {
        lines.push(`| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.description || '-'} |`);
      }
    } else {
      lines.push('No props defined.');
    }
    lines.push('');

    lines.push('## Events');
    lines.push('');
    if (comp.events.length > 0) {
      for (const event of comp.events) {
        lines.push(`- \`${event.name}\`${event.payload ? `: ${event.payload}` : ''}`);
        if (event.description) {
          lines.push(`  - ${event.description}`);
        }
      }
    } else {
      lines.push('No events defined.');
    }

    return lines.join('\n');
  }

  /**
   * Get input type for field type
   */
  private getInputType(type: PSFFieldType): string {
    if (typeof type === 'string') {
      switch (type) {
        case 'string':
          return 'text';
        case 'number':
          return 'number';
        case 'boolean':
          return 'checkbox';
        case 'date':
          return 'date';
        case 'datetime':
          return 'datetime-local';
        case 'uuid':
          return 'text';
        default:
          return 'text';
      }
    }
    return 'text';
  }

  /**
   * Get default value for field type
   */
  private getDefaultValue(type: PSFFieldType): string {
    if (typeof type === 'string') {
      switch (type) {
        case 'string':
        case 'uuid':
          return "''";
        case 'number':
          return '0';
        case 'boolean':
          return 'false';
        case 'date':
        case 'datetime':
          return 'null';
        default:
          return 'null';
      }
    }
    if ('array' in type) return '[]';
    if ('object' in type) return '{}';
    return 'null';
  }

  /**
   * Convert field type to TypeScript type
   */
  private fieldTypeToTS(type: PSFFieldType): string {
    if (typeof type === 'string') {
      switch (type) {
        case 'string':
        case 'uuid':
          return 'string';
        case 'number':
          return 'number';
        case 'boolean':
          return 'boolean';
        case 'date':
        case 'datetime':
          return 'Date';
        default:
          return 'unknown';
      }
    }
    if ('array' in type) return `${this.fieldTypeToTS(type.array)}[]`;
    if ('reference' in type) return type.reference;
    if ('enum' in type) return type.enum.map((v) => `'${v}'`).join(' | ');
    return 'unknown';
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Convert to Title Case
   */
  private toTitleCase(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }
}

/**
 * Create a PSF Svelte generator
 */
export function createPSFSvelteGenerator(options?: SvelteGeneratorOptions): PSFSvelteGenerator {
  return new PSFSvelteGenerator(options);
}
