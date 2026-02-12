# Extending Praxis-Core

**Audience:** Library authors, plugin developers, and advanced users  
**Status:** Stable guidance  
**Last Updated:** 2026-02-01

## Overview

This guide explains how to extend Praxis-Core safely and effectively without breaking existing applications. It covers best practices for creating custom rules, constraints, modules, and integrations.

## Table of Contents

- [Principles of Extension](#principles-of-extension)
- [Creating Custom Rules](#creating-custom-rules)
- [Creating Custom Constraints](#creating-custom-constraints)
- [Building Modules](#building-modules)
- [Contract Requirements](#contract-requirements)
- [Testing Extensions](#testing-extensions)
- [Publishing Extensions](#publishing-extensions)
- [Breaking Change Policy](#breaking-change-policy)

## Principles of Extension

### 1. Purity First

All rules and constraints must be pure functions:

```typescript
// ✅ GOOD: Pure function
const goodRule = defineRule({
  id: 'counter.increment',
  description: 'Increment counter',
  impl: (state, events) => {
    const incrementEvent = events.find(Increment.is);
    if (!incrementEvent) return [];
    return [CountUpdated.create({ value: state.context.count + 1 })];
  }
});

// ❌ BAD: Side effects
const badRule = defineRule({
  id: 'counter.increment',
  description: 'Increment counter',
  impl: (state, events) => {
    console.log('Incrementing!'); // Side effect: logging
    fetch('/api/increment'); // Side effect: network
    return [];
  }
});
```

**Why?** Pure functions are:
- Testable
- Predictable
- Serializable
- Cross-language compatible

### 2. Stable Identifiers

Rule and constraint IDs are permanent. Once published, they should never change.

```typescript
// ✅ GOOD: Stable, namespaced ID
const rule = defineRule({
  id: 'myapp.auth.login',  // namespace.domain.action
  description: 'Handle user login',
  impl: loginImpl
});

// ❌ BAD: Generic, likely to conflict
const rule = defineRule({
  id: 'login',  // Too generic, no namespace
  description: 'Handle user login',
  impl: loginImpl
});
```

**ID Conventions:**
- Format: `{namespace}.{domain}.{action}`
- Namespace: Your package/org name
- Domain: Feature area (auth, cart, etc.)
- Action: What the rule does

### 3. Type Safety

Always provide explicit types for context and payloads:

```typescript
// ✅ GOOD: Explicit types
interface AppContext {
  userId: string | null;
  sessionToken: string | null;
}

const LoginSuccess = defineFact<'LoginSuccess', { userId: string; token: string }>('LoginSuccess');

const loginRule = defineRule<AppContext>({
  id: 'myapp.auth.login',
  description: 'Process successful login',
  impl: (state, events) => {
    // state.context is typed as AppContext
    // Full type safety throughout
  }
});

// ❌ BAD: No types, relies on 'any'
const loginRule = defineRule({
  id: 'myapp.auth.login',
  description: 'Process successful login',
  impl: (state, events) => {
    // state.context is unknown
    // No type safety
  }
});
```

### 4. Immutability

Never mutate state directly. Always return new values:

```typescript
// ✅ GOOD: Immutable updates
const rule = defineRule<AppContext>({
  id: 'myapp.user.update',
  description: 'Update user data',
  impl: (state, events) => {
    const updateEvent = events.find(UpdateUser.is);
    if (!updateEvent) return [];
    
    // Create new context, don't mutate
    const newContext = {
      ...state.context,
      userId: updateEvent.payload.userId
    };
    
    return [UserUpdated.create(newContext)];
  }
});

// ❌ BAD: Mutates state
const rule = defineRule<AppContext>({
  id: 'myapp.user.update',
  description: 'Update user data',
  impl: (state, events) => {
    const updateEvent = events.find(UpdateUser.is);
    if (!updateEvent) return [];
    
    // WRONG: Mutates existing state
    state.context.userId = updateEvent.payload.userId;
    
    return [];
  }
});
```

## Creating Custom Rules

### Basic Rule

```typescript
import { defineRule, defineFact, defineEvent } from '@plures/praxis';

// 1. Define your events
const AddItem = defineEvent<'AddItem', { itemId: string; quantity: number }>('AddItem');

// 2. Define your facts
const ItemAdded = defineFact<'ItemAdded', { itemId: string; quantity: number }>('ItemAdded');

// 3. Define your context type
interface CartContext {
  items: Array<{ itemId: string; quantity: number }>;
}

// 4. Define the rule
const addItemRule = defineRule<CartContext>({
  id: 'myapp.cart.addItem',
  description: 'Add item to shopping cart',
  impl: (state, events) => {
    const addEvent = events.find(AddItem.is);
    if (!addEvent) return [];
    
    return [ItemAdded.create({
      itemId: addEvent.payload.itemId,
      quantity: addEvent.payload.quantity
    })];
  }
});
```

### Rule with Guards

Use guard clauses for clean, readable rules:

```typescript
const processOrderRule = defineRule<OrderContext>({
  id: 'myapp.order.process',
  description: 'Process order if valid',
  impl: (state, events) => {
    const orderEvent = events.find(PlaceOrder.is);
    
    // Guard: No event
    if (!orderEvent) return [];
    
    // Guard: Empty cart
    if (state.context.items.length === 0) {
      return [OrderRejected.create({ reason: 'Cart is empty' })];
    }
    
    // Guard: Insufficient funds
    if (state.context.balance < state.context.cartTotal) {
      return [OrderRejected.create({ reason: 'Insufficient funds' })];
    }
    
    // Happy path
    return [OrderProcessed.create({
      orderId: generateId(),
      items: state.context.items,
      total: state.context.cartTotal
    })];
  }
});
```

### Multi-Event Rules

Rules can respond to multiple event types:

```typescript
const sessionRule = defineRule<SessionContext>({
  id: 'myapp.session.manage',
  description: 'Manage user session lifecycle',
  impl: (state, events) => {
    const loginEvent = events.find(Login.is);
    const logoutEvent = events.find(Logout.is);
    const renewEvent = events.find(RenewSession.is);
    
    if (loginEvent) {
      return [SessionStarted.create({
        userId: loginEvent.payload.userId,
        expiresAt: Date.now() + 3600000 // 1 hour
      })];
    }
    
    if (logoutEvent) {
      return [SessionEnded.create({
        userId: state.context.userId
      })];
    }
    
    if (renewEvent && state.context.sessionActive) {
      return [SessionRenewed.create({
        expiresAt: Date.now() + 3600000
      })];
    }
    
    return [];
  }
});
```

## Creating Custom Constraints

### Basic Constraint

```typescript
import { defineConstraint } from '@plures/praxis';

interface CartContext {
  items: Array<{ itemId: string; quantity: number }>;
  maxItems: number;
}

const maxCartItemsConstraint = defineConstraint<CartContext>({
  id: 'myapp.cart.maxItems',
  description: 'Cart cannot exceed maximum item limit',
  impl: (state) => {
    const itemCount = state.context.items.length;
    const maxItems = state.context.maxItems;
    
    if (itemCount > maxItems) {
      return `Cart has ${itemCount} items, maximum is ${maxItems}`;
    }
    
    return true;
  }
});
```

### Constraint with Context

Constraints can validate complex business rules:

```typescript
const orderValidConstraint = defineConstraint<OrderContext>({
  id: 'myapp.order.valid',
  description: 'Order must have valid items and payment',
  impl: (state) => {
    // Check items
    if (state.context.items.length === 0) {
      return 'Order must contain at least one item';
    }
    
    // Check quantities
    const invalidQuantity = state.context.items.some(item => item.quantity <= 0);
    if (invalidQuantity) {
      return 'All items must have positive quantity';
    }
    
    // Check payment
    if (!state.context.paymentMethod) {
      return 'Payment method required';
    }
    
    // Check total
    if (state.context.total <= 0) {
      return 'Order total must be positive';
    }
    
    return true;
  }
});
```

## Building Modules

Group related rules and constraints into modules:

```typescript
import { defineModule } from '@plures/praxis';

interface CartContext {
  items: Array<{ itemId: string; quantity: number }>;
  maxItems: number;
  total: number;
}

export const cartModule = defineModule<CartContext>({
  id: 'myapp.cart',
  description: 'Shopping cart logic',
  rules: [
    addItemRule,
    removeItemRule,
    updateQuantityRule,
    clearCartRule
  ],
  constraints: [
    maxCartItemsConstraint,
    validQuantitiesConstraint,
    validTotalConstraint
  ]
});

// Usage
const registry = new PraxisRegistry<CartContext>();
registry.registerModule(cartModule);
```

## Contract Requirements

**Important:** All rules and constraints in praxis-core must have contracts when used in the Praxis repository itself (dogfooding requirement).

### Defining Contracts

```typescript
import { defineContract } from '@plures/praxis';

const addItemContract = defineContract({
  ruleId: 'myapp.cart.addItem',
  behavior: 'When an AddItem event is received, create an ItemAdded fact with the same itemId and quantity',
  examples: [
    {
      given: 'Empty cart',
      when: 'AddItem event with itemId="abc" and quantity=2',
      then: 'ItemAdded fact emitted with itemId="abc" and quantity=2'
    },
    {
      given: 'Cart with existing items',
      when: 'AddItem event with itemId="xyz" and quantity=1',
      then: 'ItemAdded fact emitted with itemId="xyz" and quantity=1'
    }
  ],
  invariants: [
    'ItemAdded.itemId === AddItem.itemId',
    'ItemAdded.quantity === AddItem.quantity',
    'Exactly one ItemAdded fact per AddItem event'
  ],
  references: [
    { type: 'doc', url: 'https://example.com/cart-spec', description: 'Cart specification' }
  ]
});

const addItemRule = defineRule<CartContext>({
  id: 'myapp.cart.addItem',
  description: 'Add item to shopping cart',
  impl: addItemImpl,
  contract: addItemContract  // Attach contract
});
```

### Contract Testing

All contract examples should have corresponding tests:

```typescript
import { describe, it, expect } from 'vitest';

describe('myapp.cart.addItem', () => {
  it('Example 1: Empty cart + AddItem -> ItemAdded', () => {
    // Given: Empty cart
    const registry = new PraxisRegistry<CartContext>();
    registry.registerRule(addItemRule);
    const engine = createPraxisEngine({
      initialContext: { items: [], maxItems: 100, total: 0 },
      registry
    });
    
    // When: AddItem event with itemId="abc" and quantity=2
    const result = engine.step([
      AddItem.create({ itemId: 'abc', quantity: 2 })
    ]);
    
    // Then: ItemAdded fact emitted
    const itemAddedFacts = result.state.facts.filter(ItemAdded.is);
    expect(itemAddedFacts).toHaveLength(1);
    expect(itemAddedFacts[0].payload.itemId).toBe('abc');
    expect(itemAddedFacts[0].payload.quantity).toBe(2);
  });
  
  // More tests for other examples...
});
```

## Testing Extensions

### Unit Tests

Test rules and constraints in isolation:

```typescript
describe('addItemRule', () => {
  it('should emit ItemAdded fact when AddItem event received', () => {
    const state: PraxisState & { context: CartContext } = {
      context: { items: [], maxItems: 100, total: 0 },
      facts: [],
      protocolVersion: '1.0.0'
    };
    
    const events = [AddItem.create({ itemId: 'test', quantity: 1 })];
    
    const result = addItemRule.impl(state, events);
    
    expect(result).toHaveLength(1);
    expect(ItemAdded.is(result[0])).toBe(true);
  });
});
```

### Integration Tests

Test modules with the full engine:

```typescript
describe('cartModule integration', () => {
  it('should handle complete cart workflow', () => {
    const registry = new PraxisRegistry<CartContext>();
    registry.registerModule(cartModule);
    
    const engine = createPraxisEngine({
      initialContext: { items: [], maxItems: 10, total: 0 },
      registry
    });
    
    // Add item
    engine.step([AddItem.create({ itemId: 'item1', quantity: 2 })]);
    
    // Update quantity
    engine.step([UpdateQuantity.create({ itemId: 'item1', quantity: 3 })]);
    
    // Verify final state
    const context = engine.getContext();
    expect(context.items).toHaveLength(1);
    expect(context.items[0].quantity).toBe(3);
  });
});
```

## Publishing Extensions

### Package Structure

```
my-praxis-extension/
├── src/
│   ├── index.ts          # Main exports
│   ├── rules.ts          # Rule definitions
│   ├── constraints.ts    # Constraint definitions
│   ├── contracts.ts      # Contract definitions
│   └── types.ts          # Type definitions
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Package.json

```json
{
  "name": "@yourorg/praxis-extension",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "@plures/praxis": "^1.0.0"
  },
  "keywords": ["praxis", "praxis-extension"]
}
```

### Version Compatibility

Specify which praxis-core versions your extension supports:

```typescript
export const EXTENSION_METADATA = {
  name: '@yourorg/praxis-extension',
  version: '1.0.0',
  praxisVersions: {
    min: '1.0.0',
    max: '1.x.x'  // Supports all 1.x versions
  }
};
```

## Breaking Change Policy

### For Extension Authors

When publishing extensions:

1. **Follow SemVer**: Major for breaking, minor for features, patch for fixes
2. **Document Changes**: Maintain a CHANGELOG.md
3. **Deprecation Path**: Deprecate before removing (one minor version notice)
4. **Migration Guide**: Provide upgrade instructions for breaking changes

### Avoiding Breaking Changes

Safe additions (non-breaking):
- ✅ New rules or constraints
- ✅ New optional fields in context types
- ✅ New examples in contracts
- ✅ Performance improvements
- ✅ Bug fixes

Breaking changes:
- ❌ Changing rule IDs
- ❌ Changing rule behavior without deprecation
- ❌ Removing rules or constraints
- ❌ Changing context type requirements
- ❌ Changing event/fact payload structures

## Best Practices Summary

1. **Pure Functions**: Rules and constraints must be pure
2. **Stable IDs**: Never change rule/constraint IDs
3. **Type Safety**: Use explicit types for all contexts and payloads
4. **Immutability**: Never mutate state
5. **Contracts**: Document behavior with contracts
6. **Tests**: Test all contract examples
7. **Namespacing**: Use namespaced IDs to avoid conflicts
8. **Documentation**: Document your extension thoroughly
9. **Versioning**: Follow semantic versioning
10. **Compatibility**: Test against supported praxis-core versions

## Examples

See these examples for reference:

- [Cart Module](../../examples/todo/) - Simple module example
- [Auth Module](../../examples/hero-shop/) - Complex module with multiple rules
- [Form Builder](../../examples/form-builder/) - Dynamic constraint validation

## Support

- **Questions**: [GitHub Discussions](https://github.com/plures/praxis/discussions)
- **Issues**: [GitHub Issues](https://github.com/plures/praxis/issues)
- **Documentation**: [Core API Docs](./praxis-core-api.md)

## References

- [Praxis-Core API](./praxis-core-api.md)
- [Decision Ledger Dogfooding](../decision-ledger/DOGFOODING.md)
- [Contributing Guide](../../CONTRIBUTING.md)

---

**Next:** [Decision Ledger](../decision-ledger/LATEST.md)
