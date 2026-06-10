//! px-grammar-gen — Generates grammar.pest from px-ast canonical types.
//!
//! Architecture:
//! - Expression grammar (v1 + v2) is a PINNED FRAGMENT (hand-curated operator precedence)
//! - Declaration grammar is GENERATED from px-ast construct types
//! - Procedure grammar is SEMI-GENERATED (structure from types, keywords pinned)
//! - Tokens/values are PINNED (shared)
//!
//! Output is deterministic. CI verifies:
//!   cargo run -p px-grammar-gen > /tmp/gen.pest && diff grammar.pest /tmp/gen.pest

mod grammar;

fn main() {
    let output = grammar::generate_full_grammar();
    print!("{}", output);
}
