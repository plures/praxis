# Advanced Rules + Constraints

Build on the basics by composing multiple rules, controlling evaluation order with rule arrays, and using constraints to enforce system-wide invariants.

**Time:** 15–20 minutes  
**Level:** Intermediate  
**Prerequisites:** [Getting Started tutorial](./getting-started.md)

## What You'll Build

An order processing pipeline that:

- Validates an order with multiple rules
- Uses constraints to enforce business invariants
- Demonstrates rule ordering
- Shows how rules emit facts for downstream reads

## Step 1: Define the Domain Schema

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

// Domain state
const Order = definePath<{
  items: { sku: string; qty: number; price: number }[];
  status: 'draft' | 'validated' | 'priced' | 'submitted';
}>('order', { items: [], status: 'draft' });
```

## Step 2: Compose Ordered Rules

Unified rules evaluate in the order they are passed to `createApp()`. Place rules that derive prerequisite facts earlier in the array so later reads see a predictable pipeline.

```ts
// First — validate stock before pricing
const validateStock = defineRule({
  id: 'order.validateStock',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number }[]; status: string };
    if (order.status !== 'draft') return RuleResult.noop();

    const allValid = order.items.every((item) => item.qty > 0 && item.qty <= 100);
    if (!allValid) {
      return RuleResult.emit([fact('order.stockInvalid', {})]);
    }
    return RuleResult.emit([fact('order.stockValidated', {})]);
  },
});

// Second — compute total after validation
const computeTotal = defineRule({
  id: 'order.computeTotal',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    return RuleResult.emit([fact('order.totalComputed', { total })]);
  },
});

// Third — apply discount tiers from the same order data
const applyDiscount = defineRule({
  id: 'order.applyDiscount',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    let discount = 0;
    if (total >= 200) discount = 0.15;
    else if (total >= 100) discount = 0.1;
    else if (total >= 50) discount = 0.05;

    return RuleResult.emit([fact('order.discountApplied', { discount })]);
  },
});
```

## Step 3: Define Constraints

Unified constraints are invariants that guard mutations before state is committed. Use them for requirements that must block invalid state.

```ts
// Constraint — final total must never be negative
const totalNonNegative = defineConstraint({
  id: 'order.totalNonNegative',
  description: 'Order total after discount must be non-negative',
  watch: ['order'],
  validate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    return total >= 0 || `Final total is negative: ${total}`;
  },
});

// Constraint — order must have at least one item to leave draft
const hasItems = defineConstraint({
  id: 'order.hasItems',
  description: 'Order must contain at least one item before submission',
  watch: ['order'],
  validate: (values) => {
    const order = values['order'] as { items: unknown[]; status: string };
    if (order.status === 'draft') return true;
    return order.items.length > 0 || 'Cannot submit an empty order';
  },
});
```

## Step 4: Wire and Run

```ts
const app = createApp({
  name: 'order-processing',
  schema: [Order],
  rules: [validateStock, computeTotal, applyDiscount],
  constraints: [totalNonNegative, hasItems],
});

// Add items to the order
const orderResult = app.mutate('order', {
  items: [
    { sku: 'WIDGET-A', qty: 3, price: 25.0 },
    { sku: 'GADGET-B', qty: 1, price: 75.0 },
  ],
  status: 'draft',
});

const total = orderResult.facts.find((f) => f.tag === 'order.totalComputed')?.payload as { total: number } | undefined;
console.log(total?.total);
// Expected output: 150

const discount = orderResult.facts.find((f) => f.tag === 'order.discountApplied')?.payload as { discount: number } | undefined;
console.log(discount?.discount);
// Expected output: 0.1

const finalTotal = (total?.total ?? 0) * (1 - (discount?.discount ?? 0));
console.log(finalTotal);
// Expected output: 135

// Try submitting an empty order — constraint fails
const emptyResult = app.mutate('order', { items: [], status: 'submitted' });
console.log(emptyResult.accepted);
// Expected output: false
```

## Rule Composition Patterns

### Fact Reads

Rules can emit facts for the app to inspect after a mutation. In the unified API, rules watch graph paths, so dependent computations should either watch the same paths or run after the prerequisite mutation.

```ts
// Rule A emits "order.stockValidated"
// Rule B computes pricing from the same order path
// Application code reads "order.totalComputed" from the mutation result
```

### Conditional Rule Activation

Use `RuleResult.noop()` to skip evaluation when preconditions aren't met:

```ts
const onlyWhenValidated = defineRule({
  id: 'order.price',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { status: string };
    if (order.status !== 'validated') return RuleResult.noop();
    // ... pricing logic
    return RuleResult.emit([fact('order.priced', {})]);
  },
});
```

### Constraint Behavior

Constraints block invalid mutations and return a diagnostic message:

```ts
const maxOrderTotal = defineConstraint({
  id: 'order.maxTotal',
  description: 'Orders over $1000 need manager approval',
  watch: ['order'],
  validate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    return total <= 1000 || 'Manager approval required for orders over $1000';
  },
});
```

## Full Source

<details>
<summary>Click to expand <code>src/order-pipeline.ts</code></summary>

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

const Order = definePath<{
  items: { sku: string; qty: number; price: number }[];
  status: 'draft' | 'validated' | 'priced' | 'submitted';
}>('order', { items: [], status: 'draft' });

const validateStock = defineRule({
  id: 'order.validateStock',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number }[]; status: string };
    if (order.status !== 'draft') return RuleResult.noop();
    const allValid = order.items.every((item) => item.qty > 0 && item.qty <= 100);
    return allValid
      ? RuleResult.emit([fact('order.stockValidated', {})])
      : RuleResult.emit([fact('order.stockInvalid', {})]);
  },
});

const computeTotal = defineRule({
  id: 'order.computeTotal',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    return RuleResult.emit([fact('order.totalComputed', { total })]);
  },
});

const applyDiscount = defineRule({
  id: 'order.applyDiscount',
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    let discount = 0;
    if (total >= 200) discount = 0.15;
    else if (total >= 100) discount = 0.1;
    else if (total >= 50) discount = 0.05;
    return RuleResult.emit([fact('order.discountApplied', { discount })]);
  },
});

const totalNonNegative = defineConstraint({
  id: 'order.totalNonNegative',
  description: 'Order total after discount must be non-negative',
  watch: ['order'],
  validate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    return total >= 0 || 'Final total is negative';
  },
});

const hasItems = defineConstraint({
  id: 'order.hasItems',
  description: 'Order must contain at least one item before submission',
  watch: ['order'],
  validate: (values) => {
    const order = values['order'] as { items: unknown[]; status: string };
    if (order.status === 'draft') return true;
    return order.items.length > 0 || 'Cannot submit an empty order';
  },
});

const app = createApp({
  name: 'order-processing',
  schema: [Order],
  rules: [validateStock, computeTotal, applyDiscount],
  constraints: [totalNonNegative, hasItems],
});

const orderResult = app.mutate('order', {
  items: [
    { sku: 'WIDGET-A', qty: 3, price: 25.0 },
    { sku: 'GADGET-B', qty: 1, price: 75.0 },
  ],
  status: 'draft',
});

const total = orderResult.facts.find((f) => f.tag === 'order.totalComputed')?.payload as { total: number } | undefined;
const discount = orderResult.facts.find((f) => f.tag === 'order.discountApplied')?.payload as { discount: number } | undefined;
console.log(total?.total);       // 150
console.log(discount?.discount); // 0.1
```

</details>

## What's Next

- [Cloud Sync + Auth Workflow](./cloud-sync-auth.md) — synchronize state across devices
- [Decision Ledger Guide](../decision-ledger/DOGFOODING.md) — attach contracts to rules
- [API Reference](../API.md)
