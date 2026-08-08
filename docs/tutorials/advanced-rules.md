# Advanced Rules + Expectations

Build on the basics by composing multiple rules, controlling evaluation order with priorities, and using expectations to enforce system-wide invariants.

**Time:** 15–20 minutes  
**Level:** Intermediate  
**Prerequisites:** [Getting Started tutorial](./getting-started.md)

## What You'll Build

An order processing pipeline that:

- Validates an order with multiple rules
- Uses expectations to enforce business invariants
- Demonstrates rule priority ordering
- Shows fact-chaining across rules

## Step 1: Define the Domain Schema

```ts
import {
  createApp,
  definePath,
  defineRule,
  defineConstraint,
  defineExpectation,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

// Domain state
const Order = definePath<{
  items: { sku: string; qty: number; price: number }[];
  status: 'draft' | 'validated' | 'priced' | 'submitted';
}>('order', { items: [], status: 'draft' });

const OrderTotal = definePath<number>('orderTotal', 0);
const Discount = definePath<number>('discount', 0);
```

## Step 2: Compose Rules with Priorities

Rules evaluate in priority order (lower number = higher priority). This lets you build pipelines where one rule's output feeds the next.

```ts
// Priority 1 — validate stock before pricing
const validateStock = defineRule({
  id: 'order.validateStock',
  priority: 1,
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

// Priority 2 — compute total after validation
const computeTotal = defineRule({
  id: 'order.computeTotal',
  priority: 2,
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    return RuleResult.emit([fact('order.totalComputed', { total })]);
  },
});

// Priority 3 — apply discount tiers after total is known
const applyDiscount = defineRule({
  id: 'order.applyDiscount',
  priority: 3,
  watch: ['orderTotal'],
  evaluate: (values) => {
    const total = values['orderTotal'] as number;
    let discount = 0;
    if (total >= 200) discount = 0.15;
    else if (total >= 100) discount = 0.1;
    else if (total >= 50) discount = 0.05;

    return RuleResult.emit([fact('order.discountApplied', { discount })]);
  },
});
```

## Step 3: Define Expectations

Expectations are system-wide invariants that must always hold true. Unlike constraints (which guard individual mutations), expectations are checked after the full rule pipeline completes.

```ts
// Expectation — final total must never be negative
const totalNonNegative = defineExpectation({
  id: 'order.totalNonNegative',
  description: 'Order total after discount must be non-negative',
  severity: 'error',
  check: (state) => {
    const total = state.get('orderTotal') as number;
    const discount = state.get('discount') as number;
    const finalTotal = total * (1 - discount);
    return finalTotal >= 0 || `Final total is negative: ${finalTotal}`;
  },
});

// Expectation — order must have at least one item to leave draft
const hasItems = defineExpectation({
  id: 'order.hasItems',
  description: 'Order must contain at least one item before submission',
  severity: 'error',
  check: (state) => {
    const order = state.get('order') as { items: unknown[]; status: string };
    if (order.status === 'draft') return true;
    return order.items.length > 0 || 'Cannot submit an empty order';
  },
});
```

## Step 4: Wire and Run

```ts
const app = createApp({
  name: 'order-processing',
  schema: [Order, OrderTotal, Discount],
  rules: [validateStock, computeTotal, applyDiscount],
  constraints: [],
  expectations: [totalNonNegative, hasItems],
});

// Add items to the order
app.mutate('order', {
  items: [
    { sku: 'WIDGET-A', qty: 3, price: 25.0 },
    { sku: 'GADGET-B', qty: 1, price: 75.0 },
  ],
  status: 'draft',
});

console.log(app.query('orderTotal').current);
// Expected output: 150

console.log(app.query('discount').current);
// Expected output: 0.1

const finalTotal = 150 * (1 - 0.1);
console.log(finalTotal);
// Expected output: 135

// Try submitting an empty order — expectation fails
const emptyResult = app.mutate('order', { items: [], status: 'submitted' });
console.log(emptyResult.accepted);
// Expected output: false
```

## Rule Composition Patterns

### Fact Chaining

Rules can emit facts that trigger other rules. This creates a declarative pipeline:

```ts
// Rule A emits "order.stockValidated"
// Rule B watches for that fact and proceeds to pricing
// Rule C watches "orderTotal" and applies discounts
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

### Expectation Severity Levels

| Severity | Behavior |
|----------|----------|
| `error`  | Blocks the mutation — state is not committed |
| `warning`| Mutation succeeds but violation is reported |

```ts
const softLimit = defineExpectation({
  id: 'order.softLimit',
  description: 'Orders over $1000 need manager approval',
  severity: 'warning',
  check: (state) => {
    const total = state.get('orderTotal') as number;
    return total <= 1000 || 'Large order — consider manager approval';
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
  defineExpectation,
  RuleResult,
  fact,
} from '@plures/praxis/unified';

const Order = definePath<{
  items: { sku: string; qty: number; price: number }[];
  status: 'draft' | 'validated' | 'priced' | 'submitted';
}>('order', { items: [], status: 'draft' });
const OrderTotal = definePath<number>('orderTotal', 0);
const Discount = definePath<number>('discount', 0);

const validateStock = defineRule({
  id: 'order.validateStock',
  priority: 1,
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
  priority: 2,
  watch: ['order'],
  evaluate: (values) => {
    const order = values['order'] as { items: { qty: number; price: number }[] };
    const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    return RuleResult.emit([fact('order.totalComputed', { total })]);
  },
});

const applyDiscount = defineRule({
  id: 'order.applyDiscount',
  priority: 3,
  watch: ['orderTotal'],
  evaluate: (values) => {
    const total = values['orderTotal'] as number;
    let discount = 0;
    if (total >= 200) discount = 0.15;
    else if (total >= 100) discount = 0.1;
    else if (total >= 50) discount = 0.05;
    return RuleResult.emit([fact('order.discountApplied', { discount })]);
  },
});

const totalNonNegative = defineExpectation({
  id: 'order.totalNonNegative',
  description: 'Order total after discount must be non-negative',
  severity: 'error',
  check: (state) => {
    const total = state.get('orderTotal') as number;
    const discount = state.get('discount') as number;
    return total * (1 - discount) >= 0 || 'Final total is negative';
  },
});

const hasItems = defineExpectation({
  id: 'order.hasItems',
  description: 'Order must contain at least one item before submission',
  severity: 'error',
  check: (state) => {
    const order = state.get('order') as { items: unknown[]; status: string };
    if (order.status === 'draft') return true;
    return order.items.length > 0 || 'Cannot submit an empty order';
  },
});

const app = createApp({
  name: 'order-processing',
  schema: [Order, OrderTotal, Discount],
  rules: [validateStock, computeTotal, applyDiscount],
  constraints: [],
  expectations: [totalNonNegative, hasItems],
});

app.mutate('order', {
  items: [
    { sku: 'WIDGET-A', qty: 3, price: 25.0 },
    { sku: 'GADGET-B', qty: 1, price: 75.0 },
  ],
  status: 'draft',
});

console.log(app.query('orderTotal').current); // 150
console.log(app.query('discount').current);   // 0.1
```

</details>

## What's Next

- [Cloud Sync + Auth Workflow](./cloud-sync-auth.md) — synchronize state across devices
- [Decision Ledger Guide](../decision-ledger/DOGFOODING.md) — attach contracts to rules
- [API Reference](../API.md)
