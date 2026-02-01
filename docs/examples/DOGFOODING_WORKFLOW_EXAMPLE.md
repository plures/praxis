# Example: Dogfooding Workflow in Action

This example demonstrates a complete dogfooding workflow when adding a new feature to Praxis.

## Scenario: Adding a New Rule with Full Dogfooding

Let's walk through adding a new rule that validates user permissions, while actively dogfooding all relevant Plures tools.

### Step 1: Start with Decision Ledger (Contract-First)

Before writing code, define the contract:

```typescript
// src/rules/permissions.ts
import { defineContract, defineRule, PraxisRegistry } from '@plures/praxis';

// Define the contract first (Dogfooding: Decision Ledger)
const permissionCheckContract = defineContract({
  behavior: "Validates user permissions against required roles before granting access",
  
  examples: [
    {
      given: "User has role 'admin'",
      when: "User requests admin action",
      then: "Access granted fact is emitted",
    },
    {
      given: "User has role 'viewer'",
      when: "User requests admin action",
      then: "Access denied fact is emitted with reason",
    },
    {
      given: "User has no roles",
      when: "User requests any protected action",
      then: "Access denied fact is emitted",
    },
  ],
  
  invariants: [
    "Access decisions are deterministic based on roles",
    "Denied access always includes a reason",
    "Role checks are case-insensitive",
  ],
  
  assumptions: [
    {
      statement: "User roles are validated before reaching this rule",
      confidence: "high",
    },
    {
      statement: "Role names follow kebab-case convention",
      confidence: "medium",
    },
  ],
  
  references: [
    "docs/security/RBAC.md",
    "Issue #123: Permission system design",
  ],
});

// Implement the rule with contract attached
const permissionCheckRule = defineRule({
  id: 'auth.permission-check',
  description: 'Check user permissions against required roles',
  meta: {
    contract: permissionCheckContract,
  },
  impl: (state, events) => {
    // Implementation here...
  },
});
```

**Friction Found?** If the contract API is confusing or lacks examples, file a dogfooding issue immediately.

### Step 2: Visualize with CodeCanvas

Before implementing, visualize the schema:

```typescript
// scripts/visualize-auth-schema.ts
import { schemaToCanvas } from '@plures/praxis';
import { writeFileSync } from 'fs';

const authSchema = {
  entities: {
    User: {
      fields: {
        id: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
      },
    },
    Permission: {
      fields: {
        action: { type: 'string' },
        requiredRoles: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

// Dogfooding: CodeCanvas
const canvas = schemaToCanvas(authSchema);
writeFileSync('./docs/auth-schema.json', JSON.stringify(canvas, null, 2));

console.log('✅ Canvas exported to docs/auth-schema.json');
// TODO: Convert to visual diagram format
```

Run it:
```bash
npx tsx scripts/visualize-auth-schema.ts
```

**Friction Found?** If `schemaToCanvas` doesn't handle your schema correctly, file a dogfooding issue with the schema structure.

### Step 3: Generate Tests from Contract

Write tests that mirror the contract examples:

```typescript
// test/rules/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { permissionCheckRule } from '../../src/rules/permissions';
import { createPraxisEngine, PraxisRegistry } from '@plures/praxis';

describe('auth.permission-check', () => {
  // Test Example 1 from contract
  it('should grant access when user has required role', () => {
    const registry = new PraxisRegistry();
    registry.registerRule(permissionCheckRule);
    
    const engine = createPraxisEngine({
      initialContext: { user: { roles: ['admin'] } },
      registry,
    });
    
    const events = [
      { type: 'REQUEST_ADMIN_ACTION', payload: { action: 'delete-user' } },
    ];
    
    const result = engine.step(events);
    expect(result.facts.some(f => f.type === 'ACCESS_GRANTED')).toBe(true);
  });
  
  // Test Example 2 from contract
  it('should deny access when user lacks required role', () => {
    const registry = new PraxisRegistry();
    registry.registerRule(permissionCheckRule);
    
    const engine = createPraxisEngine({
      initialContext: { user: { roles: ['viewer'] } },
      registry,
    });
    
    const events = [
      { type: 'REQUEST_ADMIN_ACTION', payload: { action: 'delete-user' } },
    ];
    
    const result = engine.step(events);
    const deniedFact = result.facts.find(f => f.type === 'ACCESS_DENIED');
    expect(deniedFact).toBeDefined();
    expect(deniedFact?.payload.reason).toBeDefined();
  });
  
  // Test Invariant: Denied access always includes reason
  it('invariant: denied access always includes reason', () => {
    // Test implementation...
  });
});
```

**Friction Found?** If testing the contract examples is cumbersome, file a dogfooding issue suggesting auto-generation.

### Step 4: Generate Documentation with State-Docs

Generate documentation from your module:

```typescript
// scripts/generate-auth-docs.ts
import { createStateDocsGenerator } from '@plures/praxis';
import { permissionCheckRule } from '../src/rules/permissions';
import { PraxisRegistry } from '@plures/praxis';

const registry = new PraxisRegistry();
registry.registerRule(permissionCheckRule);

// Dogfooding: State-Docs
const docsGenerator = createStateDocsGenerator({
  projectTitle: 'Praxis Auth Module',
  target: './docs/generated/auth',
});

const docs = docsGenerator.generateFromModule({
  name: 'auth',
  rules: [permissionCheckRule],
});

console.log('✅ Documentation generated at docs/generated/auth');
```

Run it:
```bash
npx tsx scripts/generate-auth-docs.ts
```

**Friction Found?** If State-Docs doesn't extract contract information properly, file a dogfooding issue.

### Step 5: Run Validation (Before Commit)

```bash
# Dogfooding: Praxis CLI
npm run scan:rules
npm run validate:contracts
npm test
npm run typecheck
```

**Friction Found?** If validation output is unclear or doesn't show file paths, file a dogfooding issue.

### Step 6: Use PluresDB for Test Fixtures

Instead of manual test data, use PluresDB:

```typescript
// test/fixtures/auth-fixtures.ts
import { createInMemoryDB, createPluresDBAdapter } from '@plures/praxis';

// Dogfooding: PluresDB
export async function createAuthTestFixtures() {
  const db = createInMemoryDB();
  const adapter = createPluresDBAdapter({ db });
  
  // Pre-populate test data
  await db.insert('users', {
    id: 'user-1',
    roles: ['admin', 'moderator'],
  });
  
  await db.insert('users', {
    id: 'user-2',
    roles: ['viewer'],
  });
  
  return { db, adapter };
}
```

**Friction Found?** If PluresDB setup is tedious for tests, file a dogfooding issue.

### Step 7: File Friction Reports

Throughout this process, you might have encountered friction. File issues:

1. **Issue #1**: "State-Docs doesn't extract contract examples automatically"
   - Tool: State-Docs
   - Type: Missing feature
   - Impact: Medium
   
2. **Issue #2**: "CodeCanvas export format isn't compatible with Mermaid"
   - Tool: CodeCanvas
   - Type: Missing feature
   - Impact: Low
   
3. **Issue #3**: "Praxis CLI validate doesn't show file paths for contract gaps"
   - Tool: Praxis CLI
   - Type: Confusing error message
   - Impact: High

## Summary: Tools Used

In this workflow, we dogfooded:

- ✅ **Decision Ledger**: Contract-first development
- ✅ **CodeCanvas**: Schema visualization
- ✅ **State-Docs**: Documentation generation
- ✅ **Praxis CLI**: Validation and scaffolding
- ✅ **PluresDB**: Test fixture management

**Friction reports filed**: 3  
**Developer experience improved**: 🚀

## Next Steps

After completing the feature:

1. Review the friction reports filed
2. Prioritize high-impact issues
3. Update the [Plures Tools Inventory](../PLURES_TOOLS_INVENTORY.md) with learnings
4. Share insights in the weekly dogfooding review

---

This example demonstrates the complete dogfooding loop: **Use → Observe → Report → Improve**.
