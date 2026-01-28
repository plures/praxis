# Decision Ledger Example

This example demonstrates the Decision Ledger integration for Praxis, showing how to define contracts for rules and constraints, validate them using the CLI, and maintain an immutable behavior ledger.

## Running the Example

```bash
# Install dependencies (from project root)
npm install

# Build the project
npm run build

# Run the programmatic example
node examples/decision-ledger/index.js
```

## CLI Validation

The Decision Ledger also provides a powerful CLI for validating contracts:

### 1. Basic Validation

```bash
npx praxis validate --registry examples/sample-registry.js
```

### 2. JSON Output (for programmatic processing)

```bash
npx praxis validate --registry examples/sample-registry.js --output json > validation.json
```

### 3. SARIF Output (for CI/CD and GitHub Code Scanning)

```bash
npx praxis validate --registry examples/sample-registry.js --output sarif > results.sarif
```

### 4. Create Logic Ledger Snapshots

```bash
npx praxis validate --registry examples/sample-registry.js --ledger ./ledger --author "team-name"
```

This creates versioned snapshots in the ledger directory:
```
ledger/
  logic-ledger/
    index.json
    auth-login-abc123/
      v0001.json
      LATEST.json
```

### 5. Emit Contract Gaps as Facts

```bash
npx praxis validate --registry examples/sample-registry.js --emit-facts --gap-output gaps.json
```

### 6. Strict Mode (for CI/CD)

```bash
npx praxis validate --registry examples/sample-registry.js --strict
```

Exits with error code 1 if contracts are missing or incomplete.

## Sample Registry

The `examples/sample-registry.js` file contains:

- **Complete Contracts**: `auth.login`, `auth.logout`, `auth.maxSessions`
- **Incomplete Contract**: `order.process` (missing behavior and invariants)
- **No Contract**: `cart.addItem` (triggers warning)

## Contract Structure

```javascript
import { defineContract, defineRule } from '@plures/praxis';

const contract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Process login events and create user session facts',
  examples: [
    {
      given: 'User provides valid credentials',
      when: 'LOGIN event is received',
      then: 'UserSessionCreated fact is emitted'
    }
  ],
  invariants: [
    'Session must have unique ID',
    'Session must have timestamp'
  ],
  assumptions: [
    {
      id: 'assume-unique-username',
      statement: 'Usernames are unique across the system',
      confidence: 0.9,
      justification: 'Standard practice in authentication systems',
      impacts: ['spec', 'tests', 'code'],
      status: 'active'
    }
  ],
  references: [
    { type: 'doc', url: 'https://docs.example.com/auth' }
  ]
});

const rule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => { /* ... */ },
  contract: contract  // Attach contract to rule
});
```

## What This Example Demonstrates

1. **Contract Definition**: Defining contracts with behavior, examples, invariants, and assumptions
2. **Registry Integration**: Attaching contracts to rules and constraints
3. **Validation**: Validating contract coverage at runtime
4. **Behavior Ledger**: Maintaining an append-only history of contract changes
5. **Reporting**: Generating validation reports in different formats

## Files

- `index.js` - Main example code
- `README.md` - This file

## Expected Output

The example will output:

1. Contracts being defined and registered
2. Validation report showing complete and incomplete contracts
3. Ledger entries with version history
4. Active assumptions tracking

## Learning Points

- How to document rule behavior explicitly
- How to track assumptions and their confidence levels
- How to validate contract coverage programmatically
- How to maintain an audit trail of behavior changes
