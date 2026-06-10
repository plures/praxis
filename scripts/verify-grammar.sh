#!/usr/bin/env bash
# verify-grammar.sh — CI script for ADR-0021 enforcement.
# Regenerates grammar.pest and verifies it matches the committed copy.
# Fails if manual edits were made to grammar.pest without updating px-ast.
#
# Usage: ./scripts/verify-grammar.sh
# Exit 0 = grammar matches generated output
# Exit 1 = grammar has been manually modified

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PRAXIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLURESDB_GRAMMAR="${PLURESDB_GRAMMAR:-../../pluresdb/crates/pluresdb-px/src/px/grammar.pest}"

echo "==> Generating grammar from px-ast types..."
GENERATED=$(cd "$PRAXIS_ROOT" && cargo run -p px-grammar-gen 2>/dev/null)

echo "==> Comparing with committed grammar..."
COMMITTED=$(cat "$PLURESDB_GRAMMAR")

if [ "$GENERATED" = "$COMMITTED" ]; then
    echo "✅ Grammar matches generated output (ADR-0021 enforced)"
    exit 0
else
    echo "❌ Grammar does NOT match generated output!"
    echo ""
    echo "The committed grammar.pest has been manually edited."
    echo "This violates ADR-0021: grammar must be generated from px-ast types."
    echo ""
    echo "To fix:"
    echo "  1. Update px-ast types in praxis/crates/px-ast/src/"
    echo "  2. Update fragment files in praxis/crates/px-grammar-gen/src/fragments/"
    echo "  3. Run: cargo run -p px-grammar-gen > path/to/grammar.pest"
    echo "  4. Commit the regenerated grammar"
    echo ""
    echo "diff (first 20 lines):"
    diff <(echo "$GENERATED") <(echo "$COMMITTED") | head -20
    exit 1
fi
