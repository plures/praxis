/**
 * Example: Order Processing System using Actors and Flows
 *
 * This example demonstrates:
 * - Multiple actors working together
 * - Flows for tracking order progression
 * - Rules for business logic
 * - Constraints for data validation
 * - Actor system for coordination
 */

import {
  createRegistry,
  createStepFunction,
  createActor,
  createActorSystem,
  createFlow,
  advanceFlow,
  rule,
  constraint,
} from '../dist/index.js';

// Create registries for different actors
const inventoryRegistry = createRegistry();
const orderRegistry = createRegistry();

// Inventory rules
const outOfStockRule = rule()
  .id('out-of-stock-alert')
  .on('CHECK_INVENTORY')
  .when((state, event) => state.facts.stock < event.data.quantity)
  .then((state, event) => [
    {
      type: 'ALERT',
      payload: {
        message: `Low stock for ${event.data.product}: ${state.facts.stock} available, ${event.data.quantity} requested`,
      },
    },
  ])
  .build();

inventoryRegistry.registerRule(outOfStockRule);

// Order rules
const orderConfirmedRule = rule()
  .id('order-confirmed')
  .on('CONFIRM_ORDER')
  .when((state) => state.facts.status === 'pending')
  .then((state) => [
    {
      type: 'SEND_EMAIL',
      payload: {
        to: state.facts.customerEmail,
        subject: 'Order Confirmed',
        body: `Your order #${state.facts.orderId} has been confirmed!`,
      },
    },
  ])
  .priority(10)
  .build();

orderRegistry.registerRule(orderConfirmedRule);

// Constraints
const stockConstraint = constraint()
  .id('positive-stock')
  .check((state) => state.facts.stock >= 0)
  .message('Stock cannot be negative')
  .build();

inventoryRegistry.registerConstraint(stockConstraint);

// Create step functions
const inventoryStep = createStepFunction({
  registry: inventoryRegistry,
  checkConstraints: true,
  reducer: (state, event) => {
    switch (event.type) {
      case 'CHECK_INVENTORY':
        return state;

      case 'RESERVE_INVENTORY':
        const reserved = Math.min(state.facts.stock, event.data.quantity);
        return {
          ...state,
          facts: {
            ...state.facts,
            stock: state.facts.stock - reserved,
            reserved: (state.facts.reserved || 0) + reserved,
          },
        };

      case 'RELEASE_INVENTORY':
        return {
          ...state,
          facts: {
            ...state.facts,
            stock: state.facts.stock + event.data.quantity,
            reserved: Math.max(0, (state.facts.reserved || 0) - event.data.quantity),
          },
        };

      default:
        return state;
    }
  },
});

const orderStep = createStepFunction({
  registry: orderRegistry,
  checkConstraints: true,
  reducer: (state, event) => {
    switch (event.type) {
      case 'CREATE_ORDER':
        return {
          ...state,
          facts: {
            ...state.facts,
            orderId: event.data.orderId,
            customerEmail: event.data.customerEmail,
            items: event.data.items,
            status: 'pending',
          },
        };

      case 'CONFIRM_ORDER':
        return {
          ...state,
          facts: {
            ...state.facts,
            status: 'confirmed',
            confirmedAt: event.timestamp,
          },
        };

      case 'SHIP_ORDER':
        return {
          ...state,
          facts: {
            ...state.facts,
            status: 'shipped',
            shippedAt: event.timestamp,
          },
        };

      case 'DELIVER_ORDER':
        return {
          ...state,
          facts: {
            ...state.facts,
            status: 'delivered',
            deliveredAt: event.timestamp,
          },
        };

      default:
        return state;
    }
  },
});

// Create actors
const laptopInventory = createActor(
  'inventory-laptop',
  { facts: { product: 'laptop', stock: 5, reserved: 0 } },
  inventoryStep,
  'inventory'
);

const mouseInventory = createActor(
  'inventory-mouse',
  { facts: { product: 'mouse', stock: 20, reserved: 0 } },
  inventoryStep,
  'inventory'
);

const order1 = createActor(
  'order-001',
  { facts: { orderId: 'ORD-001', status: 'new' } },
  orderStep,
  'order'
);

// Create actor system
const system = createActorSystem();
system.register(laptopInventory);
system.register(mouseInventory);
system.register(order1);

// Create order flow
const orderFlow = createFlow(
  'order-processing',
  [
    { id: 'create', expectedEventType: 'CREATE_ORDER' },
    { id: 'confirm', expectedEventType: 'CONFIRM_ORDER' },
    { id: 'ship', expectedEventType: 'SHIP_ORDER' },
    { id: 'deliver', expectedEventType: 'DELIVER_ORDER' },
  ],
  'Track order from creation to delivery'
);

// Helper to handle effects
function handleEffects(effects) {
  if (!effects || effects.length === 0) return;

  effects.forEach((effect) => {
    switch (effect.type) {
      case 'ALERT':
        console.log(`  ⚠️  ${effect.payload.message}`);
        break;
      case 'SEND_EMAIL':
        console.log(`  📧 Email to ${effect.payload.to}: ${effect.payload.subject}`);
        break;
      case 'LOG':
        console.log(`  📝 ${effect.payload.message}`);
        break;
    }
  });
}

// Run simulation
console.log('=== Order Processing System ===\n');

// Create order
console.log('1. Creating order...');
let result = system.send('order-001', {
  type: 'CREATE_ORDER',
  timestamp: Date.now(),
  data: {
    orderId: 'ORD-001',
    customerEmail: 'customer@example.com',
    items: [
      { product: 'laptop', quantity: 2 },
      { product: 'mouse', quantity: 3 },
    ],
  },
});
let flowResult = advanceFlow(
  orderFlow,
  result ? { type: 'CREATE_ORDER', timestamp: Date.now() } : null
);
console.log(`  ✅ Flow: ${flowResult.flow.steps[flowResult.flow.currentStep - 1].id}`);
handleEffects(result?.effects);

// Check inventory for laptop
console.log('\n2. Checking laptop inventory...');
result = system.send('inventory-laptop', {
  type: 'CHECK_INVENTORY',
  timestamp: Date.now(),
  data: { product: 'laptop', quantity: 2 },
});
handleEffects(result?.effects);
console.log(`  ℹ️  Laptop stock: ${system.get('inventory-laptop').state.facts.stock}`);

// Reserve inventory
console.log('\n3. Reserving inventory...');
result = system.send('inventory-laptop', {
  type: 'RESERVE_INVENTORY',
  timestamp: Date.now(),
  data: { quantity: 2 },
});
console.log(
  `  ✅ Reserved 2 laptops. Remaining: ${system.get('inventory-laptop').state.facts.stock}`
);

result = system.send('inventory-mouse', {
  type: 'RESERVE_INVENTORY',
  timestamp: Date.now(),
  data: { quantity: 3 },
});
console.log(`  ✅ Reserved 3 mice. Remaining: ${system.get('inventory-mouse').state.facts.stock}`);

// Confirm order
console.log('\n4. Confirming order...');
result = system.send('order-001', {
  type: 'CONFIRM_ORDER',
  timestamp: Date.now(),
});
flowResult = advanceFlow(flowResult.flow, { type: 'CONFIRM_ORDER', timestamp: Date.now() });
console.log(`  ✅ Flow: ${flowResult.flow.steps[flowResult.flow.currentStep - 1].id}`);
handleEffects(result?.effects);

// Ship order
console.log('\n5. Shipping order...');
result = system.send('order-001', {
  type: 'SHIP_ORDER',
  timestamp: Date.now(),
});
flowResult = advanceFlow(flowResult.flow, { type: 'SHIP_ORDER', timestamp: Date.now() });
console.log(`  ✅ Flow: ${flowResult.flow.steps[flowResult.flow.currentStep - 1].id}`);

// Deliver order
console.log('\n6. Delivering order...');
result = system.send('order-001', {
  type: 'DELIVER_ORDER',
  timestamp: Date.now(),
});
flowResult = advanceFlow(flowResult.flow, { type: 'DELIVER_ORDER', timestamp: Date.now() });
console.log(`  ✅ Flow: ${flowResult.flow.steps[flowResult.flow.currentStep - 1].id}`);
console.log(`  🎉 Flow complete: ${flowResult.flow.complete}`);

// Display final state
console.log('\n=== Final System State ===');
console.log('\nInventory:');
console.log(
  `  Laptops: ${system.get('inventory-laptop').state.facts.stock} available, ${system.get('inventory-laptop').state.facts.reserved} reserved`
);
console.log(
  `  Mice: ${system.get('inventory-mouse').state.facts.stock} available, ${system.get('inventory-mouse').state.facts.reserved} reserved`
);

console.log('\nOrder:');
const orderState = system.get('order-001').state.facts;
console.log(`  Order ID: ${orderState.orderId}`);
console.log(`  Status: ${orderState.status}`);
console.log(`  Customer: ${orderState.customerEmail}`);

console.log('\n=== System Metrics ===');
console.log(`  Total actors: ${system.size()}`);
console.log(`  Flow progress: ${flowResult.flow.currentStep}/${flowResult.flow.steps.length}`);
