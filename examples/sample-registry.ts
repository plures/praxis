/**
 * Sample Registry Module for Decision Ledger Testing
 * 
 * This module demonstrates how to define rules and constraints with contracts.
 */

import {
  PraxisRegistry,
  defineRule,
  defineConstraint,
  defineContract,
  type PraxisEvent,
  type PraxisFact,
  type PraxisState,
} from '../src/index.js';

// Define a contract for the login rule
const loginContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Process login events and create user session facts',
  examples: [
    {
      given: 'User provides valid credentials',
      when: 'LOGIN event is received',
      then: 'UserSessionCreated fact is emitted',
    },
    {
      given: 'User provides invalid credentials',
      when: 'LOGIN event is received',
      then: 'LoginFailed fact is emitted',
    },
  ],
  invariants: [
    'Session must have unique ID',
    'Session must have timestamp',
    'Session username must match login username',
  ],
  assumptions: [
    {
      id: 'assume-unique-username',
      statement: 'Usernames are unique across the system',
      confidence: 0.9,
      justification: 'Standard practice in authentication systems',
      derivedFrom: 'System design documentation',
      impacts: ['spec', 'tests', 'code'],
      status: 'active',
    },
  ],
  references: [
    { type: 'doc', url: 'https://docs.example.com/auth', description: 'Authentication documentation' },
    { type: 'ticket', description: 'AUTH-123: Implement login flow' },
  ],
});

// Define the login rule
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state: PraxisState, events: PraxisEvent[]): PraxisFact[] => {
    const facts: PraxisFact[] = [];
    
    for (const event of events) {
      if (event.tag === 'LOGIN') {
        const { username, password } = event.payload as { username: string; password: string };
        
        // Simple validation (in real implementation, this would check against a database)
        if (username && password) {
          facts.push({
            tag: 'UserSessionCreated',
            payload: {
              sessionId: `session-${Date.now()}`,
              username,
              timestamp: new Date().toISOString(),
            },
          });
        } else {
          facts.push({
            tag: 'LoginFailed',
            payload: {
              username,
              reason: 'Invalid credentials',
            },
          });
        }
      }
    }
    
    return facts;
  },
  contract: loginContract,
});

// Define a contract for the logout rule
const logoutContract = defineContract({
  ruleId: 'auth.logout',
  behavior: 'Process logout events and remove user session',
  examples: [
    {
      given: 'Active user session exists',
      when: 'LOGOUT event is received',
      then: 'UserSessionDestroyed fact is emitted',
    },
  ],
  invariants: [
    'Session must exist before logout',
    'Session must be destroyed after logout',
  ],
});

// Define the logout rule
const logoutRule = defineRule({
  id: 'auth.logout',
  description: 'Process logout events',
  impl: (state: PraxisState, events: PraxisEvent[]): PraxisFact[] => {
    const facts: PraxisFact[] = [];
    
    for (const event of events) {
      if (event.tag === 'LOGOUT') {
        const { sessionId } = event.payload as { sessionId: string };
        
        facts.push({
          tag: 'UserSessionDestroyed',
          payload: {
            sessionId,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
    
    return facts;
  },
  contract: logoutContract,
});

// Define a contract for the max sessions constraint
const maxSessionsContract = defineContract({
  ruleId: 'auth.maxSessions',
  behavior: 'Ensure user does not exceed maximum concurrent sessions',
  examples: [
    {
      given: 'User has 4 active sessions',
      when: 'State is checked',
      then: 'Constraint passes',
    },
    {
      given: 'User has 6 active sessions',
      when: 'State is checked',
      then: 'Constraint fails with error message',
    },
  ],
  invariants: [
    'Maximum 5 concurrent sessions per user',
    'Session count must be non-negative',
  ],
});

// Define the max sessions constraint
const maxSessionsConstraint = defineConstraint({
  id: 'auth.maxSessions',
  description: 'User cannot have more than 5 concurrent sessions',
  impl: (state: PraxisState): boolean | string => {
    const sessions = state.facts.filter((f) => f.tag === 'UserSessionCreated');
    const destroyed = state.facts.filter((f) => f.tag === 'UserSessionDestroyed');
    const activeSessions = sessions.length - destroyed.length;
    
    if (activeSessions > 5) {
      return `Too many concurrent sessions: ${activeSessions} (max 5)`;
    }
    
    return true;
  },
  contract: maxSessionsContract,
});

// Rule without contract (for testing missing contract warnings)
const incompleteRule = defineRule({
  id: 'cart.addItem',
  description: 'Add item to shopping cart (no contract)',
  impl: (state: PraxisState, events: PraxisEvent[]): PraxisFact[] => {
    const facts: PraxisFact[] = [];
    
    for (const event of events) {
      if (event.tag === 'ADD_TO_CART') {
        const { itemId, quantity } = event.payload as { itemId: string; quantity: number };
        
        facts.push({
          tag: 'ItemAddedToCart',
          payload: { itemId, quantity },
        });
      }
    }
    
    return facts;
  },
  // No contract - should trigger warning
});

// Rule with incomplete contract
const partialContract = defineContract({
  ruleId: 'order.process',
  behavior: '', // Empty behavior - should trigger warning
  examples: [
    {
      given: 'Cart has items',
      when: 'CHECKOUT event is received',
      then: 'Order is created',
    },
  ],
  invariants: [], // Empty invariants - should trigger warning
});

const partialRule = defineRule({
  id: 'order.process',
  description: 'Process order checkout (incomplete contract)',
  impl: (state: PraxisState, events: PraxisEvent[]): PraxisFact[] => {
    const facts: PraxisFact[] = [];
    
    for (const event of events) {
      if (event.tag === 'CHECKOUT') {
        facts.push({
          tag: 'OrderCreated',
          payload: {
            orderId: `order-${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
    
    return facts;
  },
  contract: partialContract,
});

// Create and configure the registry
export const registry = new PraxisRegistry({
  compliance: {
    enabled: true,
    requiredFields: ['behavior', 'examples', 'invariants'],
    missingSeverity: 'warning',
  },
});

// Register rules and constraints
registry.registerRule(loginRule);
registry.registerRule(logoutRule);
registry.registerRule(incompleteRule);
registry.registerRule(partialRule);
registry.registerConstraint(maxSessionsConstraint);

// Export for use in tests and CLI
export default registry;
