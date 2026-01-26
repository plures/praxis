# Decision Ledger Example

This example demonstrates the Decision Ledger integration for Praxis, showing how to define contracts for rules and constraints, validate them, and maintain an immutable behavior ledger.

## Running the Example

```bash
# Install dependencies (from project root)
npm install

# Build the project
npm run build

# Run the example
node index.js
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
