# Praxis Conversations Subsystem Implementation

## Overview

This document summarizes the implementation of the **praxis-conversations** subsystem, a deterministic-first conversation ingestion pipeline integrated into the Praxis framework.

## Implementation Date

February 1, 2024

## Deliverables

### 1. JSON Schemas

Located in `src/conversations/`:

- **conversation.schema.json**: Defines the structure for conversation data including turns, metadata, and classification
- **candidate.schema.json**: Defines the structure for emission candidates (GitHub issues, documentation, etc.)

### 2. Core Pipeline Modules

The pipeline follows this deterministic flow:

```
capture → redact → normalize → classify → candidates → gate → emit
```

**Modules** (all in `src/conversations/`):

- `capture.ts`: Capture conversations from various sources
- `redact.ts`: Deterministic PII redaction (email, phone, IP, SSN, credit cards)
- `normalize.ts`: Content normalization (whitespace, code blocks)
- `classify.ts`: Keyword-based classification (bug-report, feature-request, question, etc.)
- `candidates.ts`: Generate emission candidates from classified conversations
- `gate.ts`: Quality gates (minimum length, valid title, metadata, duplicates)

### 3. Emitters

Located in `src/conversations/emitters/`:

- **fs.ts**: Filesystem emitter with dry-run support
- **github.ts**: GitHub issue emitter with **HARD GATE** on `commit_intent=true`

### 4. CLI Commands

Command: `praxis conversations [subcommand]`

Subcommands:
- `capture`: Capture a conversation from input
- `push`: Process through redact + normalize pipeline
- `classify`: Classify conversation and generate candidate
- `emit`: Emit candidate to fs or github (with gates)

### 5. Tests & Fixtures

- **Tests**: `src/__tests__/conversations.test.ts` (18 comprehensive tests)
- **Fixtures**: `test/fixtures/conversations/` (3 test conversations)
  - bug-report.json
  - feature-request.json
  - question.json

All tests passing (18/18 for conversations, 404/408 total)

### 6. Documentation

- **README**: `src/conversations/README.md` (comprehensive guide)
- Includes schema documentation, CLI usage, and programmatic API examples

## Key Features

1. **Deterministic-first**: No LLM required, all logic is rule-based
2. **Hard-gated GitHub emitter**: Requires explicit `--commit-intent` flag
3. **PII redaction**: Automatic removal of sensitive data
4. **Quality gates**: 4 gates ensure quality before emission
5. **Dry-run mode**: Test without side effects
6. **Extensible**: Easy to add new emitters, classifiers, or gates

## Usage Examples

### CLI Usage

```bash
# Full pipeline
praxis conversations push -i input.json -o processed.json
praxis conversations classify -i processed.json -o candidate.json
praxis conversations emit -i candidate.json -e fs --output-dir ./output

# GitHub emission (requires --commit-intent)
praxis conversations emit -i candidate.json -e github \
  --owner myorg --repo myrepo --commit-intent
```

### Programmatic Usage

```typescript
import {
  captureConversation,
  redactConversation,
  normalizeConversation,
  classifyConversation,
  generateCandidate,
  applyGates,
  emitToFS,
} from '@plures/praxis/conversations';

// Process conversation
let conv = captureConversation({ turns: [...], metadata: {} });
conv = redactConversation(conv);
conv = normalizeConversation(conv);
conv = classifyConversation(conv);

// Generate and emit candidate
const candidate = generateCandidate(conv);
const gated = applyGates(candidate);
if (gated.gateStatus?.passed) {
  await emitToFS(gated, { outputDir: './output' });
}
```

## Security

- **CodeQL Scan**: 0 vulnerabilities found
- **PII Redaction**: Implemented for emails, phones, IPs, SSNs, credit cards
- **GitHub Gate**: Hard-gated to prevent accidental issue creation
- **Input Validation**: All inputs validated before processing

## Testing

All tests passing:
- Conversations subsystem: 18/18 tests
- Full test suite: 404/408 tests (4 skipped)

Run tests:
```bash
npm test src/__tests__/conversations.test.ts
npm test  # Full suite
```

## Code Review

Code review completed with all feedback addressed:
- Documented intentionally broad PII patterns (prioritize safety)
- Optimized label deduplication using Set (O(n) vs O(n²))
- Added clarifying comments for pattern limitations

## Files Modified/Created

### New Files (19 total)

**Core modules**:
- src/conversations/candidate.schema.json
- src/conversations/candidates.ts
- src/conversations/capture.ts
- src/conversations/classify.ts
- src/conversations/conversation.schema.json
- src/conversations/gate.ts
- src/conversations/index.ts
- src/conversations/normalize.ts
- src/conversations/redact.ts
- src/conversations/types.ts
- src/conversations/README.md

**Emitters**:
- src/conversations/emitters/fs.ts
- src/conversations/emitters/github.ts

**CLI**:
- src/cli/commands/conversations.ts

**Tests & Fixtures**:
- src/__tests__/conversations.test.ts
- test/fixtures/conversations/bug-report.json
- test/fixtures/conversations/feature-request.json
- test/fixtures/conversations/question.json

### Modified Files

- src/cli/index.ts (added conversations commands)
- .gitignore (added .demo/)

## Compliance with Praxis Decision Ledger

This implementation follows the Praxis Decision Ledger dogfooding guidelines:
- Deterministic implementation (no LLM dependencies)
- Comprehensive test coverage
- Clear contracts and schemas
- Documentation for all public APIs

## Future Enhancements

Potential improvements for future iterations:
- Additional emitters (Slack, Discord, email)
- More sophisticated classification rules
- Duplicate detection against real GitHub issues
- Custom PII patterns via configuration
- Batch processing support

## Conclusion

The praxis-conversations subsystem has been successfully implemented with:
- Complete deterministic pipeline
- Hard-gated GitHub emitter
- Comprehensive tests and documentation
- Zero security vulnerabilities
- All code review feedback addressed

The subsystem is ready for use and follows all Praxis framework conventions.
